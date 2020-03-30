import { Entity, PrimaryColumn, Column, BaseEntity } from "typeorm";
import { ObjectType, Field, Int } from "type-graphql";

@ObjectType()
@Entity("user_settings")
export class UserSettings extends BaseEntity {
  @Field(() => Int)
  @PrimaryColumn()
  userId: number;

  @Field()
  @Column()
  theme: string;
}
