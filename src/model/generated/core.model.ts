import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "./marshal"

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

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    totalRewards!: bigint
}
