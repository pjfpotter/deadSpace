import { describe, expect, it } from "vitest";
import { isIsoDate, parseOrders } from "./orders";

const products = [{ sku: "FG-BEN-2S" }, { sku: "FG-CHR-FLD" }];
const head = "order_ref,customer,delivery_date,sku,quantity\n";

describe("parseOrders", () => {
  it("parses valid rows", () => {
    const orders = parseOrders(`${head}CO-1,Customer 01,2026-12-04,FG-BEN-2S,40\n`, products);
    expect(orders).toEqual([
      { orderRef: "CO-1", customerLabel: "Customer 01", deliveryDate: "2026-12-04", sku: "FG-BEN-2S", quantity: 40 },
    ]);
  });

  it("rejects an unknown SKU naming the row", () => {
    expect(() => parseOrders(`${head}CO-1,Customer 01,2026-12-04,NOPE,4\n`, products)).toThrow(/CO-1.*unknown SKU "NOPE"/);
  });

  it.each(["0", "-3", "2.5", "abc", ""])("rejects quantity %j", (q) => {
    expect(() => parseOrders(`${head}CO-1,Customer 01,2026-12-04,FG-BEN-2S,${q}\n`, products)).toThrow(/CO-1.*quantity/);
  });

  it.each(["2026-13-01", "2026-02-30", "04/12/2026", ""])("rejects date %j", (d) => {
    expect(() => parseOrders(`${head}CO-1,Customer 01,${d},FG-BEN-2S,4\n`, products)).toThrow(/CO-1.*delivery_date/);
  });

  it("rejects duplicate refs and unknown or missing columns", () => {
    const row = "CO-1,Customer 01,2026-12-04,FG-BEN-2S,4\n";
    expect(() => parseOrders(head + row + row, products)).toThrow(/duplicate/);
    expect(() => parseOrders("order_ref,customer,delivery_date,sku,quantity,phone\n", products)).toThrow(/phone/);
    expect(() => parseOrders("order_ref,sku\n", products)).toThrow(/missing column/);
  });
});

describe("isIsoDate", () => {
  it("accepts real dates only", () => {
    expect(isIsoDate("2026-12-04")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
  });
});
