class Tobias
  class Payout < ApplicationRecord
    self.table_name = "tobias_payouts"

    belongs_to :trust
    has_many :beneficiaries, through: :trust
    has_many :payments, inverse_of: :payout, dependent: :destroy

    monetize :amount_cents

    def issue
      return if payments.present?

      per_beneficiary_amount = (amount / beneficiaries.count)
      beneficiaries.each do |beneficiary|
        payments.create_with(amount: per_beneficiary_amount).find_or_create_by(beneficiary_id: beneficiary.id)
      end
    end
  end
end
