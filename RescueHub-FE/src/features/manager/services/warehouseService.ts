// ─── Base setup ───────────────────────────────────────────────────────────────
const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ?? "https://rescuehub.onrender.com"
).trim();
const BASE = `${API_BASE}/api/v1/manager`;

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function apiFetch<T>(url: string, options: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok || json.success === false) {
    const msg =
      (Array.isArray(json.errors) ? json.errors[0] : null) ??
      json.message ??
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json.data as T;
}

// ─── Shared types ─────────────────────────────────────────────────────────────
export interface CodeName {
  code: string;
  name: string;
  color?: string | null;
}

export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

// ─── MAN-01  Warehouse ────────────────────────────────────────────────────────
export interface WarehouseLocation {
  lat: number;
  lng: number;
}

export interface Warehouse {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  status: CodeName;
  address: string;
  location: WarehouseLocation | null;
  adminArea: { id: string; name: string } | null;
  manager: { id: string; displayName: string } | null;
  zoneCount: number;
  stockLineCount: number;
  createdAt: string;
}

export interface WarehousePayload {
  warehouseCode: string;
  warehouseName: string;
  statusCode: string;
  address: string;
  location: WarehouseLocation;
}

export interface WarehouseListParams {
  keyword?: string;
  statusCode?: string;
}

export async function getWarehouses(
  token: string,
  params: WarehouseListParams = {},
): Promise<Warehouse[]> {
  const q = new URLSearchParams();
  if (params.keyword) q.set("keyword", params.keyword);
  if (params.statusCode) q.set("statusCode", params.statusCode);
  const data = await apiFetch<Warehouse[] | PagedResponse<Warehouse>>(
    `${BASE}/warehouses?${q}`,
    { headers: authHeaders(token) },
  );
  return Array.isArray(data) ? data : (data as PagedResponse<Warehouse>).items;
}

export async function getWarehouse(
  id: string,
  token: string,
): Promise<Warehouse> {
  return apiFetch<Warehouse>(`${BASE}/warehouses/${id}`, {
    headers: authHeaders(token),
  });
}

export async function createWarehouse(
  payload: WarehousePayload,
  token: string,
): Promise<Warehouse> {
  return apiFetch<Warehouse>(`${BASE}/warehouses`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateWarehouse(
  id: string,
  payload: WarehousePayload,
  token: string,
): Promise<Warehouse> {
  return apiFetch<Warehouse>(`${BASE}/warehouses/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function deleteWarehouse(
  id: string,
  token: string,
): Promise<void> {
  await apiFetch<unknown>(`${BASE}/warehouses/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

// ─── MAN-02  Stock ────────────────────────────────────────────────────────────
export interface StockLine {
  id: string;
  warehouse: { id: string; code: string; name: string };
  item: { id: string; code: string; name: string; unitCode: string };
  lot: {
    id: string;
    lotNo: string;
    expDate: string | null;
    statusCode: string;
  } | null;
  qtyOnHand: number;
  qtyReserved: number;
  qtyAvailable: number;
}

export interface StockListParams {
  warehouseId?: string;
  itemId?: string;
  lotNo?: string;
  nearExpiry?: boolean;
  page?: number;
  pageSize?: number;
}

export async function getStocks(
  token: string,
  params: StockListParams = {},
): Promise<PagedResponse<StockLine>> {
  const q = new URLSearchParams();
  if (params.warehouseId) q.set("warehouseId", params.warehouseId);
  if (params.itemId) q.set("itemId", params.itemId);
  if (params.lotNo) q.set("lotNo", params.lotNo);
  if (params.nearExpiry != null) q.set("nearExpiry", String(params.nearExpiry));
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  return apiFetch<PagedResponse<StockLine>>(`${BASE}/stocks?${q}`, {
    headers: authHeaders(token),
  });
}

// ─── MAN-03  Item ─────────────────────────────────────────────────────────────
export interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  itemCategoryCode?: string;
  itemCategory: CodeName;
  unit?: CodeName;
  unitCode?: string;
  requiresLotTracking: boolean;
  requiresExpiryTracking: boolean;
  issuePolicyCode: string;
  isActive: boolean;
  lotCount?: number;
  lots?: ItemLot[];
  createdAt: string;
}

export interface ItemLot {
  id: string;
  lotNo: string;
  mfgDate?: string | null;
  expDate: string | null;
  donorName?: string | null;
  statusCode: string;
  receivedAt: string;
}

export interface ItemDetail {
  id: string;
  itemCode: string;
  itemName: string;
  itemCategoryCode: string;
  itemCategory: CodeName;
  unitCode: string;
  requiresLotTracking: boolean;
  requiresExpiryTracking: boolean;
  issuePolicyCode: string;
  isActive: boolean;
  lots: ItemLot[];
}

export interface ItemPayload {
  itemCode: string;
  itemName: string;
  itemCategoryCode: string;
  unitCode: string;
  requiresLotTracking: boolean;
  requiresExpiryTracking: boolean;
  issuePolicyCode: string;
  receivedAt: string;
  expDate?: string;
  isActive: boolean;
}

// Item with embedded lots (from /api/v1/manager/items)
export interface ItemWithLots {
  id: string;
  itemCode: string;
  itemName: string;
  itemCategoryCode: string;
  itemCategory: { id: string; code: string; name: string };
  unitCode: string;
  requiresLotTracking: boolean;
  requiresExpiryTracking: boolean;
  issuePolicyCode: string;
  isActive: boolean;
  lotCount: number;
  lots: Array<{
    id: string;
    lotNo: string;
    expDate: string | null;
    statusCode: string;
    receivedAt: string;
  }>;
}

export interface ItemsWithLotsResponse {
  items: ItemWithLots[];
}

export async function getItemsWithLots(token: string): Promise<ItemWithLots[]> {
  const data = await apiFetch<ItemsWithLotsResponse>(`${BASE}/items`, {
    headers: authHeaders(token),
  });
  return data.items ?? [];
}

export async function getItems(token: string): Promise<Item[]> {
  const data = await apiFetch<Item[] | PagedResponse<Item>>(`${BASE}/items`, {
    headers: authHeaders(token),
  });
  return Array.isArray(data) ? data : (data as PagedResponse<Item>).items;
}

export async function getItemDetail(
  id: string,
  token: string,
): Promise<ItemDetail> {
  return apiFetch<ItemDetail>(`${BASE}/items/${id}`, {
    headers: authHeaders(token),
  });
}

export async function createItem(
  payload: ItemPayload,
  token: string,
): Promise<Item> {
  return apiFetch<Item>(`${BASE}/items`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateItem(
  id: string,
  payload: ItemPayload,
  token: string,
): Promise<Item> {
  return apiFetch<Item>(`${BASE}/items/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function deleteItem(id: string, token: string): Promise<void> {
  await apiFetch<unknown>(`${BASE}/items/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

// ─── MAN-04  Lot ──────────────────────────────────────────────────────────────
export interface Lot {
  id: string;
  item: { id: string; code: string; name: string; unitCode?: string };
  lotNo: string;
  mfgDate: string | null;
  expDate: string | null;
  donorName: string | null;
  statusCode: string;
  receivedAt: string;
}

export interface LotPayload {
  itemId: string;
  lotNo: string;
  mfgDate?: string;
  expDate?: string;
  donorName?: string;
  statusCode: string;
}

export async function getLots(token: string): Promise<Lot[]> {
  const data = await apiFetch<Lot[] | PagedResponse<Lot>>(`${BASE}/lots`, {
    headers: authHeaders(token),
  });
  return Array.isArray(data) ? data : (data as PagedResponse<Lot>).items;
}

export async function createLot(
  payload: LotPayload,
  token: string,
): Promise<Lot> {
  return apiFetch<Lot>(`${BASE}/lots`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateLot(
  id: string,
  payload: LotPayload,
  token: string,
): Promise<Lot> {
  return apiFetch<Lot>(`${BASE}/lots/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function deleteLot(id: string, token: string): Promise<void> {
  await apiFetch<unknown>(`${BASE}/lots/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

// ─── MAN-05  Stock Transaction ────────────────────────────────────────────────
export interface TransactionLine {
  itemId: string;
  lotId: string;
  qty: number;
  unitCode: string;
}

export interface StockTransactionPayload {
  transactionTypeCode: string;
  warehouseId: string;
  referenceType: string;
  referenceId?: string | null;
  happenedAt: string;
  note: string;
  lines: TransactionLine[];
}

export interface StockTransactionListItem {
  id: string;
  code: string;
  transactionTypeCode: string;
  warehouse: { id: string; code: string; name: string };
  referenceType: string;
  referenceId: string | null;
  happenedAt: string;
  note: string;
  lineCount: number;
  createdAt: string;
}

export interface StockTransaction {
  id: string;
  code: string;
  transactionTypeCode: string;
  warehouse: { id: string; code: string; name: string };
  referenceType: string;
  referenceId: string | null;
  happenedAt: string;
  note: string;
  lines: Array<{
    id: string;
    item: { id: string; code: string; name: string };
    lot: { id: string; lotNo: string } | null;
    qty: number;
    unitCode: string;
  }>;
  createdAt: string;
}

export async function getStockTransactions(
  token: string,
): Promise<StockTransactionListItem[]> {
  const data = await apiFetch<
    StockTransactionListItem[] | PagedResponse<StockTransactionListItem>
  >(`${BASE}/stock-transactions`, { headers: authHeaders(token) });
  return Array.isArray(data)
    ? data
    : (data as PagedResponse<StockTransactionListItem>).items;
}

export async function getStockTransaction(
  id: string,
  token: string,
): Promise<StockTransaction> {
  return apiFetch<StockTransaction>(`${BASE}/stock-transactions/${id}`, {
    headers: authHeaders(token),
  });
}

export async function createStockTransaction(
  payload: StockTransactionPayload,
  token: string,
): Promise<StockTransaction> {
  return apiFetch<StockTransaction>(`${BASE}/stock-transactions`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

// ─── MAN-06  Relief Issue ─────────────────────────────────────────────────────
export interface ReliefIssueLine {
  itemId: string;
  lotId: string;
  issueQty: number;
  unitCode: string;
}

export interface ReliefIssuePayload {
  campaignId: string;
  reliefPointId: string;
  fromWarehouseId: string;
  note: string;
  lines: ReliefIssueLine[];
}

// List item shape (no lines array, has lineCount)
export interface ReliefIssueListItem {
  id: string;
  code: string;
  status: { code: string; name: string; color: string | null };
  campaign: { id: string; code: string; name: string } | null;
  reliefPoint: { id: string; code: string; name: string } | null;
  fromWarehouse: { id: string; code: string; name: string };
  note: string;
  lineCount: number;
  createdAt: string;
}

// Detail shape (has lines array)
export interface ReliefIssue {
  id: string;
  code: string;
  status: { code: string; name: string; color: string | null };
  campaign: { id: string; code: string; name: string } | null;
  reliefPoint: { id: string; code: string; name: string } | null;
  fromWarehouse: { id: string; code: string; name: string };
  note: string;
  lines: Array<{
    id: string;
    item: { id: string; code: string; name: string };
    lot: { id: string; lotNo: string } | null;
    issueQty: number;
    unitCode: string;
  }>;
  createdAt: string;
}

export interface ReliefIssueListParams {
  campaignId?: string;
  reliefPointId?: string;
  statusCode?: string;
  page?: number;
  pageSize?: number;
}

export async function getReliefIssues(
  token: string,
  params: ReliefIssueListParams = {},
): Promise<PagedResponse<ReliefIssueListItem>> {
  const q = new URLSearchParams();
  if (params.campaignId) q.set("campaignId", params.campaignId);
  if (params.reliefPointId) q.set("reliefPointId", params.reliefPointId);
  if (params.statusCode) q.set("statusCode", params.statusCode);
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  return apiFetch<PagedResponse<ReliefIssueListItem>>(
    `${BASE}/relief-issues?${q}`,
    {
      headers: authHeaders(token),
    },
  );
}

export async function getReliefIssue(
  id: string,
  token: string,
): Promise<ReliefIssue> {
  return apiFetch<ReliefIssue>(`${BASE}/relief-issues/${id}`, {
    headers: authHeaders(token),
  });
}

export async function createReliefIssue(
  payload: ReliefIssuePayload,
  token: string,
): Promise<ReliefIssue> {
  return apiFetch<ReliefIssue>(`${BASE}/relief-issues`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

// ─── MAN-08  Relief Point ────────────────────────────────────────────────────
export interface ReliefPoint {
  id: string;
  reliefPointCode: string;
  reliefPointName: string;
  status: CodeName;
  address: string;
  location: WarehouseLocation | null;
  adminArea: { id: string; name: string } | null;
  createdAt: string;
}

export interface ReliefPointListParams {
  keyword?: string;
  statusCode?: string;
}

export async function getReliefPoints(
  token: string,
  params: ReliefPointListParams = {},
): Promise<ReliefPoint[]> {
  const q = new URLSearchParams();
  if (params.keyword) q.set("keyword", params.keyword);
  if (params.statusCode) q.set("statusCode", params.statusCode);
  const data = await apiFetch<ReliefPoint[] | PagedResponse<ReliefPoint>>(
    `${BASE}/relief-points?${q}`,
    { headers: authHeaders(token) },
  );
  return Array.isArray(data)
    ? data
    : (data as PagedResponse<ReliefPoint>).items;
}

// ─── MAN-09  Household ────────────────────────────────────────────────────────
export interface Household {
  id: string;
  headName: string;
  phone: string;
  adminArea: { id: string; name: string } | null;
  address: string;
  location: WarehouseLocation | null;
  memberCount: number;
  vulnerableCount: number;
  createdAt: string;
}

export interface HouseholdPayload {
  headName: string;
  phone: string;
  adminAreaId: string;
  address: string;
  location?: WarehouseLocation;
  memberCount: number;
  vulnerableCount: number;
}

export async function getHouseholds(token: string): Promise<Household[]> {
  const data = await apiFetch<Household[] | PagedResponse<Household>>(
    `${BASE}/households`,
    { headers: authHeaders(token) },
  );
  return Array.isArray(data) ? data : (data as PagedResponse<Household>).items;
}

export async function createHousehold(
  payload: HouseholdPayload,
  token: string,
): Promise<Household> {
  return apiFetch<Household>(`${BASE}/households`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateHousehold(
  id: string,
  payload: HouseholdPayload,
  token: string,
): Promise<Household> {
  return apiFetch<Household>(`${BASE}/households/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function deleteHousehold(
  id: string,
  token: string,
): Promise<void> {
  await apiFetch<unknown>(`${BASE}/households/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

// ─── MAN-08  Distribution ─────────────────────────────────────────────────────
export interface DistributionLinePayload {
  itemId: string;
  qty: number;
  unitCode: string;
}

export interface DistributionPayload {
  campaignId: string;
  adminAreaId: string;
  teamId: string;
  lines: DistributionLinePayload[];
  ackMethodCode: string;
  note?: string;
}

export interface DistributionListItem {
  id: string;
  code: string;
  status: CodeName;
  campaign: { id: string; code: string; name: string } | null;
  reliefPoint: { id: string; code: string; name: string } | null;
  household: {
    id: string;
    code: string;
    headName: string;
    phone: string;
    address: string;
  } | null;
  ackMethodCode: string;
  note: string;
  lineCount: number;
  createdAt: string;
}

// Distribution type from API - matches backend response
export interface Distribution {
  id: string;
  code: string;
  status: CodeName;
  campaign: { id: string; code: string; name: string } | null;
  reliefPoint: { id: string; code: string; name: string } | null;
  recipient: {
    id: string;
    code: string;
    name: string;
    phone: string;
    address: string;
    memberCount: number;
    vulnerableCount: number;
  } | null;
  // incidentId: string | null;
  ackMethodCode: string;
  note: string;
  lines: Array<{
    id: string;
    item: { id: string; code: string; name: string };
    lot: { id: string; lotNo: string } | null;
    qty: number;
    unitCode: string;
  }>;
  ack: {
    ackMethodCode: string | null;
    ackCode: string | null;
    ackByName: string | null;
    ackPhone: string | null;
    ackNote: string | null;
    ackAt: string | null;
  } | null;
  createdAt: string;
}

export interface AckPayload {
  ackMethodCode: string;
  ackCode: string;
  ackByName: string;
  ackPhone: string;
  ackNote: string;
}

export async function getDistributions(
  token: string,
): Promise<DistributionListItem[]> {
  const data = await apiFetch<
    DistributionListItem[] | PagedResponse<DistributionListItem>
  >(`${BASE}/distributions`, { headers: authHeaders(token) });
  return Array.isArray(data)
    ? data
    : (data as PagedResponse<DistributionListItem>).items;
}

export async function getDistribution(
  id: string,
  token: string,
): Promise<Distribution> {
  return apiFetch<Distribution>(`${BASE}/distributions/${id}`, {
    headers: authHeaders(token),
  });
}

export async function createDistribution(
  payload: DistributionPayload,
  token: string,
): Promise<Distribution> {
  return apiFetch<Distribution>(`${BASE}/distributions`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function ackDistribution(
  id: string,
  payload: AckPayload,
  token: string,
): Promise<void> {
  await apiFetch<unknown>(`${BASE}/distributions/${id}/ack`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

// ─── Distribution Options ────────────────────────────────────────────────────
export interface DistributionOptions {
  campaigns: Array<{
    id: string;
    code: string;
    name: string;
    statusCode: string;
    startAt: string;
    endAt: string | null;
  }>;
  reliefPoints: Array<{
    id: string;
    code: string;
    name: string;
    statusCode: string;
    addressText: string;
    campaign: { id: string; code: string; name: string };
    location: { lat: number; lng: number };
  }>;
  ackMethodCodes: CodeName[];
  distributionStatusCodes: CodeName[];
}

export async function getDistributionOptions(
  token: string,
): Promise<DistributionOptions> {
  return apiFetch<DistributionOptions>(`${BASE}/distributions/options`, {
    headers: authHeaders(token),
  });
}

export interface Coordinates {
  lat: number;
  lng: number;
}

// ─── Manager Teams ───────────────────────────────────────────────────────────
export interface ManagerTeam {
  id: string;
  teamCode?: string;
  teamName?: string;
  name?: string;
  status?: CodeName | { code?: string; name?: string; color?: string | null };
}

export interface CreateTeamPayload {
  code: string;
  name: string;
  leaderUserId: string;
  homeAdminAreaId: string;
  statusCode: string;
  maxParallelMissions: number;
  currentLocation: Coordinates;
  notes: string;
}

export interface Team extends ManagerTeam {
  leaderUserId: string;
  leaderUser?: { id: string; displayName: string };
  homeAdminAreaId: string;
  homeAdminArea?: { id: string; name: string };
  maxParallelMissions: number;
  currentLocation?: Coordinates;
  notes: string;
  createdAt: string;
}

export interface TeamListParams {
  statusCode?: string;
  keyword?: string;
}

export async function getManagerTeams(
  token: string,
  params: TeamListParams = {},
): Promise<ManagerTeam[]> {
  const q = new URLSearchParams();
  if (params.statusCode) q.set("statusCode", params.statusCode);
  if (params.keyword) q.set("keyword", params.keyword);

  const data = await apiFetch<ManagerTeam[] | PagedResponse<ManagerTeam>>(
    `${BASE}/teams?${q.toString()}`,
    { headers: authHeaders(token) },
  );

  return Array.isArray(data) ? data : data.items;
}

export async function createManagerTeam(
  payload: CreateTeamPayload,
  token: string,
): Promise<Team> {
  return apiFetch<Team>(`${BASE}/teams`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function getTeam(
  id: string,
  token: string,
): Promise<Team> {
  return apiFetch<Team>(`${BASE}/teams/${id}`, {
    headers: authHeaders(token),
  });
}

export async function updateManagerTeam(
  id: string,
  payload: CreateTeamPayload,
  token: string,
): Promise<Team> {
  return apiFetch<Team>(`${BASE}/teams/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function deleteManagerTeam(
  id: string,
  token: string,
): Promise<void> {
  await apiFetch<unknown>(`${BASE}/teams/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}


// ─── MAN-10  Relief Campaign ──────────────────────────────────────────────────
export interface ReliefCampaign {
  id: string;
  code: string;
  name: string;
  status: CodeName;
  adminArea: { id: string; code: string; name: string } | null;
  startAt: string;
  endAt: string | null;
  description: string | null;
  reliefPointCount: number;
}

export interface ReliefCampaignListParams {
  keyword?: string;
  statusCode?: string;
  adminAreaId?: string;
}

export async function getReliefCampaigns(
  token: string,
  params: ReliefCampaignListParams = {},
): Promise<ReliefCampaign[]> {
  const q = new URLSearchParams();
  if (params.keyword) q.set("keyword", params.keyword);
  if (params.statusCode) q.set("statusCode", params.statusCode);
  if (params.adminAreaId) q.set("adminAreaId", params.adminAreaId);

  const data = await apiFetch<
    ReliefCampaign[] | PagedResponse<ReliefCampaign>
  >(`${BASE}/relief-campaigns?${q.toString()}`, {
    headers: authHeaders(token),
  });

  return Array.isArray(data)
    ? data
    : (data as PagedResponse<ReliefCampaign>).items;
}

export interface ReliefPointSummary {
  id: string;
  code: string;
  name: string;
  statusCode: string;
}

export interface ReliefCampaignDetail extends ReliefCampaign {
  reliefPoints: ReliefPointSummary[];
}

export async function getReliefCampaign(
  campaignId: string,
  token: string,
): Promise<ReliefCampaignDetail> {
  return apiFetch<ReliefCampaignDetail>(
    `${BASE}/relief-campaigns/${campaignId}`,
    {
      headers: authHeaders(token),
    },
  );
}

export interface CreateReliefCampaignPayload {
  code: string;
  name: string;
  adminAreaId: string;
  startAt: string;
  endAt: string;
  statusCode: string;
  description?: string;
  reliefPointIds: string[];
}

export async function createReliefCampaign(
  payload: CreateReliefCampaignPayload,
  token: string,
): Promise<ReliefCampaign> {
  return apiFetch<ReliefCampaign>(`${BASE}/relief-campaigns`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}
