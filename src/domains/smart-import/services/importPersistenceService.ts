import { documentStorageService } from '../../portfolio/services/documentStorageService';
import { normalizeToIsoDate } from '../../../utils/aiDocumentExtractor';
import { deriveGoldRates } from '../../../utils/goldPricing';
import { SmartImportFormData, ImportSaveStep } from '../types';

export interface PersistenceCallbacks {
  onStepChange: (step: ImportSaveStep, message: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addAsset: (assetType: string, portfolioName: string, payload: any, options?: { reload?: boolean }) => Promise<any>;
  loadPortfolios: () => Promise<void>;
}

export interface PersistenceResult {
  success: boolean;
  assetId?: string;
  documentLinked: boolean;
  error?: string;
}

export async function executeImportPersistence(
  assetType: string,
  targetPortfolio: string,
  formData: SmartImportFormData,
  file: File | null,
  callbacks: PersistenceCallbacks
): Promise<PersistenceResult> {
  const { onStepChange, addAsset, loadPortfolios } = callbacks;

  try {
    // 1. Validating
    onStepChange('VALIDATING', 'Validating asset data...');
    let createdAssetId: string | undefined;

    // 2. Saving Primary Asset
    onStepChange('SAVING_ASSET', `Saving ${assetType.toUpperCase()} holding to ${targetPortfolio}...`);

    if (assetType === 'fd') {
      const p = parseFloat(formData.principalAmount) || 0;
      const r = parseFloat(formData.interestRate) || 0;
      const sDate = normalizeToIsoDate(formData.startDate) || new Date().toISOString().split('T')[0];
      const mDate = normalizeToIsoDate(formData.maturityDate) || sDate;
      const matAmt = parseFloat(formData.maturityAmount) || Math.round(p * (1 + (r * 0.01)));

      const res = await addAsset('fd', targetPortfolio, {
        bank_name: formData.institutionName.trim() || 'Fixed Deposit',
        bankName: formData.institutionName.trim() || 'Fixed Deposit',
        principal_amount: p,
        principalAmount: p,
        interest_rate: r,
        interestRate: r,
        start_date: sDate,
        startDate: sDate,
        maturity_date: mDate,
        maturityDate: mDate,
        maturity_amount: matAmt,
        maturityAmount: matAmt,
        status: 'active',
        notes: formData.notes,
      }, { reload: false });
      createdAssetId = res?.id || res?.data?.id;
    } else if (assetType === 'rd') {
      const monthly = parseFloat(formData.monthlyDeposit) || 0;
      const rate = parseFloat(formData.interestRate) || 0;
      const start = normalizeToIsoDate(formData.startDate) || new Date().toISOString().split('T')[0];
      const installments = parseInt(formData.totalInstallments, 10) || 12;
      const paid = parseInt(formData.paidInstallments, 10) || 1;
      const matAmt = parseFloat(formData.maturityAmount) || (monthly * installments);

      const res = await addAsset('rd', targetPortfolio, {
        bank_name: formData.institutionName.trim() || 'RD Account',
        bankName: formData.institutionName.trim() || 'RD Account',
        monthly_deposit: monthly,
        monthlyDeposit: monthly,
        interest_rate: rate,
        interestRate: rate,
        start_date: start,
        startDate: start,
        total_installments: installments,
        totalInstallments: installments,
        paid_installments: paid,
        paidInstallments: paid,
        maturity_amount: matAmt,
        maturityAmount: matAmt,
        status: 'active',
        notes: formData.notes,
      }, { reload: false });
      createdAssetId = res?.id || res?.data?.id;
    } else if (assetType === 'sip') {
      const monthly = parseFloat(formData.monthlySip) || 0;
      const nav = parseFloat(formData.nav) || 0;
      const units = parseFloat(formData.units) || 0;
      const curVal = parseFloat(formData.currentValuation) || (units > 0 && nav > 0 ? Math.round(units * nav) : 0);

      const res = await addAsset('sip', targetPortfolio, {
        fund_name: formData.fundName.trim() || 'Mutual Fund SIP',
        fundName: formData.fundName.trim() || 'Mutual Fund SIP',
        folio_number: formData.folioNumber,
        folioNumber: formData.folioNumber,
        monthly_investment: monthly,
        monthlyInvestment: monthly,
        sip_date: parseInt(formData.sipDate, 10) || 1,
        sipDate: parseInt(formData.sipDate, 10) || 1,
        nav: nav,
        units: units,
        current_valuation: curVal,
        currentValuation: curVal,
        expected_cagr: parseFloat(formData.expectedCagr) || 12,
        expectedCagr: parseFloat(formData.expectedCagr) || 12,
        status: 'active',
        notes: formData.notes,
      }, { reload: false });
      createdAssetId = res?.id || res?.data?.id;
    } else if (assetType === 'gold') {
      const grams = parseFloat(formData.weightGrams) || 0;
      let pPrice = parseFloat(formData.purchasePrice) || 0;
      if (formData.purchasePriceType === 'per_gram' || (pPrice > 1000 && pPrice <= 40000 && grams > 1 && (pPrice / grams) < 500)) {
        pPrice = Math.round(pPrice * grams);
      }

      const rates = deriveGoldRates();
      const liveRate = formData.purity === '22K' ? rates.rate22kPerGram : rates.rate24kPerGram;
      const curVal = grams > 0 ? Math.round(grams * liveRate) : pPrice;
      const pDate = normalizeToIsoDate(formData.startDate) || new Date().toISOString().split('T')[0];

      const res = await addAsset('gold', targetPortfolio, {
        item_name: formData.itemName.trim() || 'Gold Holding',
        itemName: formData.itemName.trim() || 'Gold Holding',
        purity: formData.purity || '24K',
        weight_grams: grams,
        weightGrams: grams,
        purchase_price: pPrice,
        purchasePrice: pPrice,
        current_valuation: curVal,
        currentValuation: curVal,
        purchase_date: pDate,
        purchaseDate: pDate,
        notes: formData.notes,
      }, { reload: false });
      createdAssetId = res?.id || res?.data?.id;
    } else if (assetType === 'stocks') {
      const qty = parseFloat(formData.quantity) || 1;
      const avg = parseFloat(formData.avgBuyPrice) || 0;
      const res = await addAsset('stock', targetPortfolio, {
        symbol: (formData.symbol || 'STOCK').toUpperCase().trim(),
        name: formData.stockName.trim() || formData.symbol,
        qty: qty,
        avg_price: avg,
        avgPrice: avg,
        amount_invested: Math.round(qty * avg),
        amountInvested: Math.round(qty * avg),
      }, { reload: false });
      createdAssetId = res?.id || res?.data?.id;
    } else if (assetType === 'real_estate') {
      const purchase = parseFloat(formData.purchasePriceRealty) || 0;
      const current = parseFloat(formData.currentValuationRealty) || purchase;
      const rent = parseFloat(formData.monthlyRent) || 0;
      const pDate = normalizeToIsoDate(formData.startDate) || new Date().toISOString().split('T')[0];

      const res = await addAsset('real_estate', targetPortfolio, {
        property_name: formData.propertyName.trim() || 'Real Estate Property',
        propertyName: formData.propertyName.trim() || 'Real Estate Property',
        property_type: formData.propertyType || 'Residential',
        propertyType: formData.propertyType || 'Residential',
        location: formData.location.trim() || 'Location',
        purchase_price: purchase,
        purchasePrice: purchase,
        current_valuation: current,
        currentValuation: current,
        monthly_rent: rent,
        monthlyRent: rent,
        purchase_date: pDate,
        purchaseDate: pDate,
        notes: formData.notes,
      }, { reload: false });
      createdAssetId = res?.id || res?.data?.id;
    } else if (assetType === 'insurance') {
      const sum = parseFloat(formData.sumAssured) || 0;
      const premium = parseFloat(formData.premiumAmount) || 0;
      const renewal = normalizeToIsoDate(formData.renewalDate) || new Date().toISOString().split('T')[0];

      const res = await addAsset('insurance', targetPortfolio, {
        policy_name: formData.policyName.trim() || 'Insurance Policy',
        policyName: formData.policyName.trim() || 'Insurance Policy',
        policy_number: formData.policyNumber.trim() || undefined,
        policyNumber: formData.policyNumber.trim() || undefined,
        insurance_type: formData.insuranceType || 'Term',
        insuranceType: formData.insuranceType || 'Term',
        sum_assured: sum,
        sumAssured: sum,
        premium_amount: premium,
        premiumAmount: premium,
        renewal_date: renewal,
        renewalDate: renewal,
        notes: formData.notes,
      }, { reload: false });
      createdAssetId = res?.id || res?.data?.id;
    }

    // 3. Uploading Document Attachment (if file provided)
    let documentLinked = false;
    if (file) {
      onStepChange('UPLOADING_DOCUMENT', 'Uploading supporting document to secure vault...');
      const storagePath = documentStorageService.generateStoragePath(targetPortfolio, assetType, file.name);
      
      try {
        await documentStorageService.uploadDocument('investment-documents', storagePath, file);
        
        // 4. Linking Document Record
        onStepChange('LINKING_DOCUMENT', 'Linking document to asset...');
        await addAsset('document', targetPortfolio, {
          name: file.name,
          filePath: storagePath,
          file_path: storagePath,
          fileType: file.type,
          file_type: file.type,
          linkedAssetType: assetType,
          linked_asset_type: assetType,
          linkedAssetId: createdAssetId || null,
          linked_asset_id: createdAssetId || null,
          expiryDate: formData.maturityDate ? normalizeToIsoDate(formData.maturityDate) : null,
          expiry_date: formData.maturityDate ? normalizeToIsoDate(formData.maturityDate) : null,
        }, { reload: false });
        documentLinked = true;
      } catch (uploadErr) {
        // Document failed but asset succeeded
        console.warn('Document storage upload failed, asset was created:', uploadErr);
      }
    }

    // 5. Trigger Background Portfolio Refresh
    onStepChange('SYNCING_PORTFOLIO', 'Updating portfolio totals...');
    void loadPortfolios();

    onStepChange('SUCCESS', 'Successfully imported to portfolio!');
    return {
      success: true,
      assetId: createdAssetId,
      documentLinked,
    };
  } catch (err) {
    onStepChange('ERROR', err instanceof Error ? err.message : 'Failed to import asset');
    return {
      success: false,
      documentLinked: false,
      error: err instanceof Error ? err.message : 'Failed to import asset',
    };
  }
}
