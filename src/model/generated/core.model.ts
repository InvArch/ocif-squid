import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"

@Entity_()
export class Core {
    constructor(props?: Partial<Core>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("int4", {nullable: false})
    latestClaimBlock!: number

    @Column_("int4", {nullable: false})
    coreId!: number

    @Column_("text", {nullable: false})
    totalRewards!: string

    @Column_("text", {nullable: false})
    totalUnclaimed!: string
}
