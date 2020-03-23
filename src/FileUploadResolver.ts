import { Resolver, Mutation, Arg, ObjectType, Field } from "type-graphql";
import { GraphQLUpload } from "apollo-server-express";
const path = require("path");
import { Stream } from "stream";
import { createWriteStream } from "fs";
import { parse } from "ofx-js";
const fs = require("fs");

export interface Upload {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => Stream;
}
@ObjectType()
class UploadResponse {
  @Field()
  uploaded: boolean;
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

    let account: string;
    if (parsedData.OFX.BANKMSGSRSV1) {
      account = "Bank";
    } else if (parsedData.OFX.CREDITCARDMSGSRSV1) {
      account = "Creditcard";
    } else {
      throw new Error("Could not parse account");
      return { uploaded: false };
    }

    let transactions: any;
    if (account === "Bank") {
      transactions = parsedData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST;
    } else if (account === "Creditcard") {
      transactions =
        parsedData.OFX.CREDITCARDMSGSRSV1.CCSTMTTRNRS.CCSTMTRS.BANKTRANLIST;
    }

    console.log("TRANSACTIONS: ", transactions);
    return { uploaded: true };
  }
}

// @Resolver()
// export class FileUploadResolver {
//   @Mutation(() => Boolean)
//   async uploadFile(
//     @Arg("file", () => GraphQLUpload!) { createReadStream, filename }: Upload
//   ): Promise<Boolean> {
//     console.log("FILE: ", createReadStream, filename);
//     await new Promise(res =>
//       createReadStream()
//         .pipe(createWriteStream(path.join(__dirname, "../tempFiles", filename)))
//         .on("close", res)
//     );

//     return true;
//   }
// }
