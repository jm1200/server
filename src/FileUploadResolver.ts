import { Resolver, Mutation, Arg, ObjectType, Field } from "type-graphql";
import { GraphQLUpload } from "apollo-server-express";
const path = require("path");
import { Stream } from "stream";
import { createWriteStream } from "fs";
import { parse } from "ofx-js";
import { parseTransactions } from "./modules/fileUploadResolver/parseTransactions";
const fs = require("fs");

export interface Upload {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => Stream;
}

@ObjectType()
class Transaction {
  @Field()
  account: String;
  @Field()
  type: String;
  @Field()
  datePosted: String;
  @Field()
  transId: String;
  @Field({ nullable: true })
  name: String;
  @Field()
  memo: String;
  @Field()
  amount: String;
}

@ObjectType()
class UploadResponse {
  @Field()
  uploaded: boolean;
  @Field()
  account?: string;
  @Field()
  rangeStart?: string;
  @Field()
  rangeEnd?: string;
  // @ts-ignore
  @Field(type => [Transaction])
  transactions?: Transaction[];
  // @Field(() => TransResponse)
  // transactions?: TransResponse;
}

@Resolver()
export class FileUploadResolver {
  @Mutation(() => UploadResponse)
  async uploadFile(
    @Arg("file", () => GraphQLUpload!) file: Upload
  ): Promise<UploadResponse> {
    const filepath: string = path.join(
      __dirname,
      "../tempFiles",
      file.filename
    );
    await new Promise(resolve => {
      file
        .createReadStream()
        .pipe(createWriteStream(filepath))
        .on("close", resolve);
    });

    console.log("file written");
    const data = fs.readFileSync(filepath, { encoding: "utf8" });
    if (!data) {
      throw new Error("Could not read file");
      return { uploaded: false };
    }

    const parsedData = await parse(data);
    if (!parsedData) {
      throw new Error("could not parse file");
      return { uploaded: false };
    }

    let transactions = parseTransactions(parsedData);

    console.log("TRANSACTIONS: ", transactions);
    return {
      uploaded: true,
      account: transactions.account,
      rangeStart: transactions.rangeStart,
      rangeEnd: transactions.rangeEnd,
      transactions: transactions.transactions
    };
  }
}
