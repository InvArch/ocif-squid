module.exports = class Data1703439603610 {
    name = 'Data1703439603610'

    async up(db) {
        await db.query(`CREATE TABLE "staker" ("id" character varying NOT NULL, "latest_claim_block" integer NOT NULL, "account" text NOT NULL, "total_rewards" text NOT NULL, "total_unclaimed" text NOT NULL, CONSTRAINT "PK_13561f691b22038cfa606fe1161" PRIMARY KEY ("id"))`)
        await db.query(`CREATE TABLE "core" ("id" character varying NOT NULL, "latest_claim_block" integer NOT NULL, "core_id" integer NOT NULL, "total_rewards" text NOT NULL, "total_unclaimed" text NOT NULL, "total_staked" text, "number_of_stakers" integer, CONSTRAINT "PK_3b1e52368e24baad3e1ad2b7d8b" PRIMARY KEY ("id"))`)
    }

    async down(db) {
        await db.query(`DROP TABLE "staker"`)
        await db.query(`DROP TABLE "core"`)
    }
}
