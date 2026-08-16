import { Portfolio } from '../types/portfolio';

export interface BackupAssetCounts {
  stocks: number;
  fixedDeposits: number;
  rdAccounts: number;
  sipAccounts: number;
  goldHoldings: number;
  realEstate: number;
  insurances: number;
  documents: number;
  totalAssets: number;
}

export interface BackupValidationReport {
  isValid: boolean;
  exportedAt?: string;
  portfolioCount: number;
  portfolioNames: string[];
  counts: BackupAssetCounts;
  duplicates: {
    stocks: string[];
    fixedDeposits: string[];
    goldHoldings: string[];
    realEstate: string[];
    insurances: string[];
  };
  missingLinkedDocs: {
    docName: string;
    targetAssetType: string;
    targetAssetId: string;
  }[];
  schemaErrors: string[];
  warnings: string[];
}

export interface RestoreExecutionReport {
  timestamp: string;
  createdAssets: number;
  updatedAssets: number;
  skippedDuplicates: number;
  errors: string[];
  restoredPortfolios: string[];
}

/**
 * Validates a JSON backup file content against the portfolio tracker schema,
 * calculating asset counts, detecting potential duplicates against current live data,
 * and checking for broken document links.
 */
export function validateBackupJSON(
  jsonText: string,
  existingPortfolios: Portfolio[] = []
): BackupValidationReport {
  const schemaErrors: string[] = [];
  const warnings: string[] = [];

  let data: any;
  try {
    data = JSON.parse(jsonText);
  } catch (err) {
    return {
      isValid: false,
      portfolioCount: 0,
      portfolioNames: [],
      counts: {
        stocks: 0,
        fixedDeposits: 0,
        rdAccounts: 0,
        sipAccounts: 0,
        goldHoldings: 0,
        realEstate: 0,
        insurances: 0,
        documents: 0,
        totalAssets: 0,
      },
      duplicates: { stocks: [], fixedDeposits: [], goldHoldings: [], realEstate: [], insurances: [] },
      missingLinkedDocs: [],
      schemaErrors: ['Invalid JSON format. Please ensure you selected a valid exported backup file.'],
      warnings: [],
    };
  }

  // Check top-level envelope
  const portfoliosList: any[] = Array.isArray(data) ? data : (Array.isArray(data.portfolios) ? data.portfolios : []);
  const exportedAt: string | undefined = typeof data.exportedAt === 'string' ? data.exportedAt : undefined;

  if (portfoliosList.length === 0) {
    schemaErrors.push('No valid portfolio records found in the backup file.');
  }

  const counts: BackupAssetCounts = {
    stocks: 0,
    fixedDeposits: 0,
    rdAccounts: 0,
    sipAccounts: 0,
    goldHoldings: 0,
    realEstate: 0,
    insurances: 0,
    documents: 0,
    totalAssets: 0,
  };

  const portfolioNames: string[] = [];
  const backupAssetIds = new Set<string>();

  const duplicates = {
    stocks: [] as string[],
    fixedDeposits: [] as string[],
    goldHoldings: [] as string[],
    realEstate: [] as string[],
    insurances: [] as string[],
  };

  // Build existing lookup maps for duplicate detection
  const existingStockTickers = new Set<string>();
  const existingFDNames = new Set<string>();
  const existingGoldItems = new Set<string>();
  const existingPropNames = new Set<string>();
  const existingPolicies = new Set<string>();

  existingPortfolios.forEach(p => {
    p.holdings?.forEach(h => existingStockTickers.add(`${p.name}:${h.ticker.toUpperCase()}`));
    p.fixedDeposits?.forEach(fd => existingFDNames.add(`${p.name}:${fd.bank_name.toLowerCase()}:${fd.principal_amount}`));
    p.goldHoldings?.forEach(g => existingGoldItems.add(`${p.name}:${g.item_name.toLowerCase()}:${g.weight_grams}`));
    p.realEstate?.forEach(re => existingPropNames.add(`${p.name}:${re.property_name.toLowerCase()}`));
    p.insurances?.forEach(ins => existingPolicies.add(`${p.name}:${ins.policy_name.toLowerCase()}`));
  });

  const missingLinkedDocs: BackupValidationReport['missingLinkedDocs'] = [];

  for (let idx = 0; idx < portfoliosList.length; idx++) {
    const p = portfoliosList[idx];
    if (!p || typeof p !== 'object') {
      schemaErrors.push(`Portfolio item at index ${idx} is not an object.`);
      continue;
    }

    const pName = p.name || p.id || `portfolio-${idx + 1}`;
    portfolioNames.push(pName);

    // Validate Stocks
    if (Array.isArray(p.holdings)) {
      counts.stocks += p.holdings.length;
      p.holdings.forEach((h: any, hIdx: number) => {
        if (!h.ticker) {
          schemaErrors.push(`Portfolio "${pName}" Stock #${hIdx + 1} is missing a ticker.`);
        } else {
          if (h.id) backupAssetIds.add(h.id);
          if (existingStockTickers.has(`${pName}:${h.ticker.toUpperCase()}`)) {
            duplicates.stocks.push(`${h.ticker} (${pName})`);
          }
        }
      });
    }

    // Validate Fixed Deposits
    if (Array.isArray(p.fixedDeposits)) {
      counts.fixedDeposits += p.fixedDeposits.length;
      p.fixedDeposits.forEach((fd: any, fIdx: number) => {
        if (!fd.bank_name) {
          schemaErrors.push(`Portfolio "${pName}" FD #${fIdx + 1} is missing bank_name.`);
        } else {
          if (fd.id) backupAssetIds.add(fd.id);
          const key = `${pName}:${fd.bank_name.toLowerCase()}:${fd.principal_amount}`;
          if (existingFDNames.has(key)) {
            duplicates.fixedDeposits.push(`${fd.bank_name} ₹${fd.principal_amount} (${pName})`);
          }
        }
      });
    }

    // Validate Recurring Deposits
    if (Array.isArray(p.rdAccounts)) {
      counts.rdAccounts += p.rdAccounts.length;
      p.rdAccounts.forEach((rd: any) => {
        if (rd.id) backupAssetIds.add(rd.id);
      });
    }

    // Validate SIPs
    if (Array.isArray(p.sipAccounts)) {
      counts.sipAccounts += p.sipAccounts.length;
      p.sipAccounts.forEach((sip: any) => {
        if (sip.id) backupAssetIds.add(sip.id);
      });
    }

    // Validate Gold Holdings
    if (Array.isArray(p.goldHoldings)) {
      counts.goldHoldings += p.goldHoldings.length;
      p.goldHoldings.forEach((g: any, gIdx: number) => {
        if (!g.item_name) {
          schemaErrors.push(`Portfolio "${pName}" Gold #${gIdx + 1} is missing item_name.`);
        } else {
          if (g.id) backupAssetIds.add(g.id);
          const key = `${pName}:${g.item_name.toLowerCase()}:${g.weight_grams}`;
          if (existingGoldItems.has(key)) {
            duplicates.goldHoldings.push(`${g.item_name} ${g.weight_grams}g (${pName})`);
          }
        }
      });
    }

    // Validate Real Estate
    if (Array.isArray(p.realEstate)) {
      counts.realEstate += p.realEstate.length;
      p.realEstate.forEach((re: any, rIdx: number) => {
        if (!re.property_name) {
          schemaErrors.push(`Portfolio "${pName}" Real Estate #${rIdx + 1} is missing property_name.`);
        } else {
          if (re.id) backupAssetIds.add(re.id);
          const key = `${pName}:${re.property_name.toLowerCase()}`;
          if (existingPropNames.has(key)) {
            duplicates.realEstate.push(`${re.property_name} (${pName})`);
          }
        }
      });
    }

    // Validate Insurance Policies
    if (Array.isArray(p.insurances)) {
      counts.insurances += p.insurances.length;
      p.insurances.forEach((ins: any, iIdx: number) => {
        if (!ins.policy_name) {
          schemaErrors.push(`Portfolio "${pName}" Insurance #${iIdx + 1} is missing policy_name.`);
        } else {
          if (ins.id) backupAssetIds.add(ins.id);
          const key = `${pName}:${ins.policy_name.toLowerCase()}`;
          if (existingPolicies.has(key)) {
            duplicates.insurances.push(`${ins.policy_name} (${pName})`);
          }
        }
      });
    }

    // Validate Document Metadata
    if (Array.isArray(p.documents)) {
      counts.documents += p.documents.length;
      p.documents.forEach((doc: any, dIdx: number) => {
        if (!doc.name || !doc.file_path) {
          schemaErrors.push(`Portfolio "${pName}" Document #${dIdx + 1} is missing name or file_path.`);
        }
        if (doc.asset_id && !backupAssetIds.has(doc.asset_id)) {
          missingLinkedDocs.push({
            docName: doc.name || 'Untitled Document',
            targetAssetType: doc.asset_type || 'asset',
            targetAssetId: doc.asset_id,
          });
        }
      });
    }
  }

  counts.totalAssets =
    counts.stocks +
    counts.fixedDeposits +
    counts.rdAccounts +
    counts.sipAccounts +
    counts.goldHoldings +
    counts.realEstate +
    counts.insurances +
    counts.documents;

  const duplicateTotal =
    duplicates.stocks.length +
    duplicates.fixedDeposits.length +
    duplicates.goldHoldings.length +
    duplicates.realEstate.length +
    duplicates.insurances.length;

  if (duplicateTotal > 0) {
    warnings.push(`Found ${duplicateTotal} asset records that already exist in your active portfolios.`);
  }

  if (missingLinkedDocs.length > 0) {
    warnings.push(`${missingLinkedDocs.length} vault document references point to asset IDs not present in this backup.`);
  }

  return {
    isValid: schemaErrors.length === 0,
    exportedAt,
    portfolioCount: portfolioNames.length,
    portfolioNames,
    counts,
    duplicates,
    missingLinkedDocs,
    schemaErrors,
    warnings,
  };
}
