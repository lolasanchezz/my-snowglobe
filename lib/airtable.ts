// Minimal Airtable REST client for the Snowglobe base. Server-only: it
// reads AIRTABLE_API_KEY, which must never reach the browser, so only
// import it from server components, route handlers and server actions.

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appP8Yyjc3WshfvJg";

export const TABLES = {
	submissions: "Snowglobe-Event-Submission",
	votes: "Snowglobe-Event-Votes",
};

export interface AirtableRecord<F> {
	id: string;
	createdTime: string;
	fields: F;
}

function apiKey(): string {
	const key = process.env.AIRTABLE_API_KEY;
	if (!key) throw new Error("AIRTABLE_API_KEY is not set");
	return key;
}

function tableUrl(table: string): string {
	return `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`;
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
	const res = await fetch(url, {
		...init,
		cache: "no-store",
		headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json", ...init.headers },
	});
	if (!res.ok) throw new Error(`Airtable ${init.method ?? "GET"} ${res.status}: ${await res.text()}`);
	return (await res.json()) as T;
}

/** All records in a table (follows pagination), optionally filtered. */
export async function listRecords<F>(table: string, filterByFormula?: string): Promise<AirtableRecord<F>[]> {
	const records: AirtableRecord<F>[] = [];
	let offset: string | undefined;
	do {
		const params = new URLSearchParams({ pageSize: "100" });
		if (filterByFormula) params.set("filterByFormula", filterByFormula);
		if (offset) params.set("offset", offset);
		const page = await request<{ records: AirtableRecord<F>[]; offset?: string }>(`${tableUrl(table)}?${params}`);
		records.push(...page.records);
		offset = page.offset;
	} while (offset);
	return records;
}

export async function createRecords<F>(table: string, rows: Partial<F>[]): Promise<AirtableRecord<F>[]> {
	const created: AirtableRecord<F>[] = [];
	for (let i = 0; i < rows.length; i += 10) {
		const { records } = await request<{ records: AirtableRecord<F>[] }>(tableUrl(table), {
			method: "POST",
			body: JSON.stringify({ records: rows.slice(i, i + 10).map((fields) => ({ fields })), typecast: true }),
		});
		created.push(...records);
	}
	return created;
}

export async function updateRecord<F>(table: string, id: string, fields: Partial<F>): Promise<AirtableRecord<F>> {
	return request<AirtableRecord<F>>(`${tableUrl(table)}/${id}`, {
		method: "PATCH",
		body: JSON.stringify({ fields, typecast: true }),
	});
}

export async function deleteRecords(table: string, ids: string[]): Promise<void> {
	for (let i = 0; i < ids.length; i += 10) {
		const params = new URLSearchParams();
		for (const id of ids.slice(i, i + 10)) params.append("records[]", id);
		await request(`${tableUrl(table)}?${params}`, { method: "DELETE" });
	}
}

/** Quote a value for use inside an Airtable formula string. */
export function formulaString(value: string): string {
	return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
