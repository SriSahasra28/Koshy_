const db = require("../db/sequelize");
const { APIError } = require("../middlewares/errorHandler.middleware");
const { catchAsync } = require("../utils/catchAsync.utils");
const ResponseCodes = require("../utils/responseCodes");
const { sendResponse } = require("../utils/utils.common");

class GroupController {
  static createGroup = catchAsync(async (req, res) => {
    const { group_name } = req.body;

    const [alreadyExists] = await db.sequelize.query(
      `select * from baskets where group_name = '${group_name?.trim()}'`
    );

    console.log("alreadyExists", alreadyExists);

    if (alreadyExists?.length) {
      throw new APIError({
        code: ResponseCodes.ALREADY_EXIST,
        message: "Group already exists",
      });
    }

    const [results] = await db.sequelize.query(
      `insert into baskets (group_name) values ('${group_name}')`
    );

    return sendResponse({
      res,
      success: true,
      message: "Group created successfully",
      response_code: ResponseCodes.CREATED,
    });
  });

  static getGroups = catchAsync(async (req, res) => {
    const [results] = await db.sequelize.query(`select * from baskets`);

    return sendResponse({
      res,
      success: true,
      message: "Groups fetched successfully",
      response_code: ResponseCodes.OK,
      data: results,
    });
  });

  static getSymbols = catchAsync(async (req, res) => {
    const { search } = req.query;

    let query = `SELECT tradingsymbol FROM instruments where instrument_type = 'EQ' and exchange = 'NSE' and name != '' and tradingsymbol like '${search}%' order by tradingsymbol limit 50;`;

    if (!search) {
      query = `SELECT tradingsymbol FROM instruments where instrument_type = 'EQ' and exchange = 'NSE' and name != '' and tradingsymbol like '%${search}%' order by tradingsymbol limit 50;`;
    }

    const [results] = await db.sequelize.query(query);

    return sendResponse({
      res,
      success: true,
      message: "",
      response_code: ResponseCodes.OK,
      data: results,
    });
  });

  static getGroupDetails = catchAsync(async (req, res) => {
    const { group_id } = req.params;

    const [results] = await db.sequelize.query(
      `select * from baskets where id = ${group_id}`
    );

    if (!results?.length) {
      throw new APIError({
        code: ResponseCodes.NOT_FOUND,
        message: "Group not found",
      });
    }

    console.log("results", results);

    return sendResponse({
      res,
      success: true,
      message: "Group fetched successfully",
      response_code: ResponseCodes.OK,
      data: results[0],
    });
  });

  static updateGroup = catchAsync(async (req, res) => {
    const { group_id } = req.params;
    const { group_name } = req.body;

    const [alreadyExists] = await db.sequelize.query(
      `select * from baskets where group_name = '${group_name?.trim()}'`
    );

    console.log("alreadyExists", alreadyExists);

    if (alreadyExists?.length) {
      throw new APIError({
        code: ResponseCodes.ALREADY_EXIST,
        message: "Group already exists",
      });
    }

    const [results] = await db.sequelize.query(`
    UPDATE baskets SET group_name = '${group_name?.trim()}' WHERE id= ${group_id};
    `);

    console.log("results", results);

    return sendResponse({
      res,
      success: true,
      message: "Group updated successfully",
      response_code: ResponseCodes.OK,
    });
  });

  static deleteGroup = catchAsync(async (req, res) => {
    const { group_id } = req.params;

    const [results] = await db.sequelize.query(`
    DELETE FROM baskets WHERE id= ${group_id};
    `);

    if (results.affectedRows == 0) {
      throw new APIError({
        code: ResponseCodes.NOT_FOUND,
        message: "Group not found",
      });
    }

    return sendResponse({
      res,
      success: true,
      message: "Group deleted successfully",
      response_code: ResponseCodes.OK,
    });
  });

  static addStockForGroup = catchAsync(async (req, res) => {
    const { group_id, option_types = [], symbol } = req.body;

    const [symbolRes, groupRes] = await Promise.all([
      db.sequelize.query(`
      SELECT tradingsymbol FROM instruments where tradingsymbol = '${symbol.trim()}';
    `),
      db.sequelize.query(`SELECT * FROM baskets where id = ${group_id};`),
    ]);

    console.log("symbolRes", symbolRes);
    console.log("groupRes", groupRes);

    if (symbolRes?.length) {
      for (let i = 0; i < symbolRes?.length; i++) {
        const symbol = symbolRes[i];

        if (!symbol?.length) {
          throw new APIError({
            code: ResponseCodes.NOT_FOUND,
            message: `Symbol not found!`,
          });
        }
      }
    }

    if (groupRes?.length) {
      for (let i = 0; i < groupRes?.length; i++) {
        const symbol = groupRes[i];

        if (!symbol?.length) {
          throw new APIError({
            code: ResponseCodes.NOT_FOUND,
            message: `Group not found!`,
          });
        }
      }
    }

    if (option_types?.length) {
      for (let i = 0; i < option_types.length; i++) {
        let optionType = option_types[i];

        console.log("optionType", optionType);

        const [alreadyExists] = await db.sequelize.query(
          `select * from basket_stocks where basket_id = '${group_id?.trim()}' AND option_type = '${optionType.trim()}' AND symbol='${symbol.trim()}';`
        );

        console.log("alreadyExists", alreadyExists);

        if (alreadyExists?.length) {
          throw new APIError({
            code: ResponseCodes.ALREADY_EXIST,
            message: `${symbol} with option type ${optionType} already exists!`,
          });
        }

        const [results] = await db.sequelize.query(
          `insert into basket_stocks (basket_id, symbol, option_type) values ('${group_id}', '${symbol}', '${optionType}');`
        );
      }
    }

    return sendResponse({
      res,
      success: true,
      message: "Symbol added successfully",
      response_code: ResponseCodes.CREATED,
    });
  });

  static getSymbolsForGroup = catchAsync(async (req, res) => {
    const { group_id } = req.params;

    // Get symbols from filter_options table (where group symbols are actually stored)
    const [results] = await db.sequelize.query(
      `SELECT 
        fo.id,
        fo.symbol,
        fo.option_name as option_type,
        fo.expiry,
        fo.instrument_token,
        fo.basket_id,
        fo.group_name
      FROM filter_options fo
      WHERE fo.basket_id = ?
      ORDER BY fo.symbol, fo.option_name`,
      {
        replacements: [group_id]
      }
    );

    return sendResponse({
      res,
      success: true,
      message: "",
      response_code: ResponseCodes.OK,
      data: results,
    });
  });

  static deleteSymbol = catchAsync(async (req, res) => {
    const { group_id, symbol_id } = req.params;

    console.log(`[deleteSymbol] ========== START ==========`);
    console.log(`[deleteSymbol] Received: group_id=${group_id}, symbol_id=${symbol_id}`);
    console.log(`[deleteSymbol] Types: group_id=${typeof group_id}, symbol_id=${typeof symbol_id}`);

    // symbol_id from frontend is now the filter_options.id (database row ID) after fixing getSymbolsForGroup
    // Delete by ID directly
    const [results] = await db.sequelize.query(`
      DELETE FROM filter_options 
      WHERE id = ?
    `, {
      replacements: [symbol_id]
    });

    console.log(`[deleteSymbol] Deletion result: affectedRows=${results.affectedRows}`);

    if (results.affectedRows == 0) {
      console.log(`[deleteSymbol] No rows deleted. Checking if symbol exists...`);
      
      // Check if the ID exists in filter_options
      const [checkResults] = await db.sequelize.query(`
        SELECT id, symbol, option_name, basket_id, group_name 
        FROM filter_options 
        WHERE id = ?
      `, {
        replacements: [symbol_id]
      });

      console.log(`[deleteSymbol] Symbol check:`, checkResults);

      throw new APIError({
        code: ResponseCodes.NOT_FOUND,
        message: `Symbol not found in filter_options with id=${symbol_id}`,
      });
    }

    console.log(`[deleteSymbol] ========== END ==========`);

    return sendResponse({
      res,
      success: true,
      message: "Symbol deleted successfully",
      response_code: ResponseCodes.OK,
    });
  });

  static getGroupsTreeData = catchAsync(async (req, res) => {
    // Only show groups that exist in baskets table and are active
    const [results] = await db.sequelize
      .query(`SELECT fo.group_name, fo.symbol as stockName, fo.option_name as options 
      FROM filter_options fo
      INNER JOIN baskets b ON fo.group_name = b.group_name AND b.active = 1
      ORDER BY fo.group_name, fo.symbol, fo.option_name`);

      // console.log("raw result =====")
      // console.log(results)

    // const [results] = await db.sequelize
    // .query(`
    //   SELECT 
    //     b.group_name, 
    //     b.symbol as stockName, 
    //     b.option_name as options,
    //     CASE 
    //       WHEN b.option_name LIKE '%CE' THEN 'CE'
    //       WHEN b.option_name LIKE '%PE' THEN 'PE'
    //       WHEN b.option_name LIKE '%FUT' THEN 'FUT'
    //       ELSE 'Other'
    //     END as option_type
    //   FROM filter_options b 
    //   ORDER BY 
    //     b.group_name, 
    //     b.symbol, 
    //     option_type, 
    //     b.option_name
    // `);
  

    const transformedData = [];

    let currentGroup = null;
    let currentStock = null;

    results.forEach((row) => {
      console.log("ROW---------------")
      console.log(row)
      if (row.group_name !== currentGroup) {
        console.log("HERE1---------------")
        currentGroup = row.group_name;
        transformedData.push({ groupName: currentGroup, stocks: [] });
        currentStock = null;
      }
      
      if (row.stockName !== currentStock) {
        console.log("HERE2---------------")
        currentStock = row.stockName;
        transformedData[transformedData.length - 1].stocks.push({
          stockName: currentStock,
          options: [row.options],
        });
      } else {
        console.log("HERE3---------------")
        transformedData[transformedData.length - 1].stocks[
          transformedData[transformedData.length - 1].stocks.length - 1
        ].options.push(row.options);
      }
    });

    console.log("TRANSFORMED DATA====")
    console.log(transformedData)

    return sendResponse({
      res,
      success: true,
      message: "Groups fetched successfully",
      response_code: ResponseCodes.OK,
      data: transformedData,
    });
  });

  static disableSymbol = catchAsync(async (req, res) => {
    const { symbol_id } = req.params;
    const symbol = symbol_id?.trim();

    console.log(`[disableSymbol] ========== START ==========`);
    console.log(`[disableSymbol] Received symbol_id: ${symbol}`);

    // Update monitor_symbols (if it exists there)
    const [monitorResults] = await db.sequelize.query(`
      UPDATE monitor_symbols 
      SET active = 0 
      WHERE symbol = ?
    `, {
      replacements: [symbol]
    });

    console.log(`[disableSymbol] monitor_symbols update: affectedRows=${monitorResults.affectedRows}`);

    // ✅ CRITICAL: Also delete from filter_options (where group symbols are stored)
    // symbol_id is the option_name (tradingsymbol) like 'ADANIENT26JANFUT'
    const [filterResults] = await db.sequelize.query(`
      DELETE FROM filter_options 
      WHERE option_name = ? OR symbol = ?
    `, {
      replacements: [symbol, symbol]
    });

    console.log(`[disableSymbol] filter_options deletion: affectedRows=${filterResults.affectedRows}`);
    console.log(`[disableSymbol] ========== END ==========`);

    const totalAffected = monitorResults.affectedRows + filterResults.affectedRows;

    return sendResponse({
      res,
      success: true,
      message: totalAffected > 0 
        ? "Symbol disabled and removed from groups successfully" 
        : "Symbol not found in monitor_symbols or filter_options",
      response_code: ResponseCodes.OK,
    });
  });
}

module.exports = GroupController;
