// Who counts as a Snowglobe admin: anyone listed in ADMIN_EMAILS
// (comma-separated), or anyone with "super_admin" ticked in the Snowglobe
// base's Users table. Admins can sign in even if they aren't on the Attend
// list.
import { formulaString, listRecords } from "./airtable";

const USERS_TABLE = "Users";

function envAdmins(): Set<string> {
	return new Set(
		(process.env.ADMIN_EMAILS ?? "")
			.split(",")
			.map((e) => e.trim().toLowerCase())
			.filter(Boolean),
	);
}

export async function isAdminEmail(email: string | undefined): Promise<boolean> {
	if (!email) return false;
	const needle = email.trim().toLowerCase();
	if (envAdmins().has(needle)) return true;
	try {
		const rows = await listRecords(USERS_TABLE, `AND({super_admin}, LOWER({email}) = ${formulaString(needle)})`);
		return rows.length > 0;
	} catch (err) {
		console.error("admin lookup failed", err);
		return false;
	}
}
