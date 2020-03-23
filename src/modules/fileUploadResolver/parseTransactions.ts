import moment from "moment";

export class Transaction {
  account: String;
  type: String;
  datePosted: String;
  transId: String;
  name: String;
  memo: String;
  amount: String;
}
export class TransResponse {
  account: String;
  rangeStart: String;
  rangeEnd: String;
  transactions: Transaction[];
}
export const parseTransactions = (parsedData: any) => {
  //get account type
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
    const data = parsedData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST;
    transactions = parseTransObj(
      account,
      data.DTSTART,
      data.DTEND,
      data.STMTTRN
    );
  } else if (account === "Creditcard") {
    const data =
      parsedData.OFX.CREDITCARDMSGSRSV1.CCSTMTTRNRS.CCSTMTRS.BANKTRANLIST;
    transactions = parseTransObj(
      account,
      data.DTSTART,
      data.DTEND,
      data.STMTTRN
    );
  }
  return transactions;
};

function parseTransObj(
  account: String,
  start: String,
  end: String,
  trans: [Transaction]
): TransResponse {
  let transactions = trans.map((transObj: any) => ({
    account,
    type: transObj.TRNTYPE,
    datePosted: formatDate(transObj.DTPOSTED),
    transId: transObj.FITID,
    name: transObj.NAME,
    memo: transObj.MEMO,
    amount: transObj.TRNAMT
  }));

  return {
    account,
    rangeStart: formatDate(start),
    rangeEnd: formatDate(end),
    transactions
  };
}

const formatDate = (date: String) => {
  return moment(
    date
      .split("")
      .slice(0, 8)
      .join("")
  ).format("MMM Do YYYY");
};
