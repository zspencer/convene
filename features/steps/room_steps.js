const { Given, When, Then } = require("@cucumber/cucumber");

const {
  SpacePage,
  SpaceEditPage,
  RoomEditPage,
  RoomPage,
} = require("../harness/Pages");
const { RoomCardComponent } = require("../harness/Components");
const {
  Space,
  Room,
  Actor,
  linkParameters,
  AccessCode,
  AccessLevel,
} = require("../lib");

const assert = require("assert").strict;

Given(
  "{a} {space} with {a} {accessLevel} {room}",
  async function (_, space, _, accessLevel, room) {
    this.spaces = this.spaces || {};
    if (this.spaces[space.name]) {
      return;
    }

    return this.api()
      .spaces()
      .create(space)
      .then((space) => (this.spaces[space.name] = space));
  }
);

When(
  "{a} {actor} unlocks {a} {accessLevel} {room} in {a} {space} with {a} {accessCode}",
  function (a, actor, a2, accessLevel, room, a3, space, a4, accessCode) {
    // @todo someday, it would be nice to consolidate the AccessLevel Parameter Type, since it's only ever used in context with a room
    linkParameters({ room, accessLevel });

    return actor
      .signIn(this.driver, space)
      .then(() => new SpaceEditPage(this.driver, space).visit())
      .then((page) => page.roomCard(room).configure())
      .then((page) => page.unlock(accessCode));
  }
);

When(
  "{a} {actor} locks {a} {accessLevel} {room} in {a} {space} with {a} {accessCode}",
  async function (_, actor, _, accessLevel, room, _a, space, _, accessCode) {
    linkParameters({ accessLevel, room });
    await actor.signIn(this.driver, space);

    return new SpaceEditPage(this.driver, space)
      .visit()
      .then((page) => page.roomCard(room).configure())
      .then((roomSettingsPage) => roomSettingsPage.lock(accessCode));
  }
);

When("the {actor} taps the {room} in the Room Picker", function (actor, room) {
  return this.space.roomCard(room).enter();
});

Then("the {actor} is placed in the {room}", async function (actor, room) {
  const roomPage = new RoomPage(this.driver, room);
  assert(await roomPage.videoPanel().isDisplayed());
});

Then("the {actor} is not placed in the {room}", function (actor, room) {
  // Write code here that turns the phrase above into concrete actions
  return "pending";
});

Then(
  "{a} {actor} may not enter {a} {accessLevel} {room} in {a} {space} after providing {a} {accessCode}",
  /**
   *
   * @param {Actor} actor
   * @param {AccessLevel} accessLevel
   * @param {Room} room
   * @param {Space} space
   * @param {AccessCode} accessCode
   */
  function (_, _actor, _, accessLevel, room, _, space, _, accessCode) {
    linkParameters({ room, accessLevel });

    return this.driver
      .manage()
      .deleteAllCookies()
      .then(() => new SpacePage(this.driver, space).visit())
      .then((spacePage) => spacePage.roomCard(room).enter(accessCode))
      .then((waitingRoomPage) => {
        return Promise.all([
          waitingRoomPage.isWaitingRoom().then(assert),
          waitingRoomPage.errors().isDisplayed().then(assert),
        ]);
      });
  }
);

Then(
  "{a} {actor} may enter {a} {accessLevel} {room} in {a} {space} after providing {a} {accessCode}",
  function (_, actor, _, accessLevel, room, _, space, _, accessCode) {
    linkParameters({ room, accessLevel, accessCode });

    return this.driver
      .manage()
      .deleteAllCookies()
      .then(() => new SpacePage(this.driver, space).visit())
      .then((spacePage) => spacePage.roomCard(room).enter(accessCode))
      .then((roomPage) => roomPage.isWaitingRoom())
      .then((isWaitingRoom) => assert(!isWaitingRoom));
  }
);

Then("the {space} has a {room}", function (space, room) {
  // Write code here that turns the phrase above into concrete actions
  return "pending";
});

Then(
  "the {actor} does not see the {room}'s Door",
  async function (actor, room) {
    const card = new RoomCardComponent(this.driver, room);
    assert(!(await card.isDisplayed()));
  }
);

Then("{a} {room} is {accessLevel}", async function (_, room, accessLevel) {
  const { space } = linkParameters({ room, accessLevel });
  await new SpacePage(this.driver, space).visit();
  if (accessLevel.level === "Locked") {
    const roomCard = new RoomCardComponent(this.driver, room);
    assert(await roomCard.isLocked());
    assert(await roomCard.enter().then((page) => page.isWaitingRoom()));
  }
});

Then(
  "{a} {actor} is informed they need to set {a} {accessCode} when they are locking {a} {room}",
  async function (_, actor, _, accessCode, _, room) {
    const roomSettingPage = new RoomEditPage(this.driver);
    assert(await roomSettingPage.accessCodeError());
  }
);
