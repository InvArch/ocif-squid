import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"

@Entity_()
export class Staker {
    constructor(props?: Partial<Staker>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("int4", {nullable: false})
    latestClaimBlock!: number

    @Column_("text", {nullable: false})
    account!: string

    @Column_("text", {nullable: false})
    totalRewards!: string

    @Column_("text", {nullable: false})
    totalUnclaimed!: string
}
