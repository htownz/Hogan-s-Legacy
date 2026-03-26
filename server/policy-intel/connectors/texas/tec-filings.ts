/**
 * TEC Filings Connector
 *
 * Fetches lobbyist and PAC data from the Texas Ethics Commission (TEC).
 * Normalizes into stakeholder records + source documents.
 *
 * TEC data sources:
 *  - Lobbyist search: https://www.ethics.state.tx.us/search/lobby
 *  - Campaign finance: https://www.ethics.state.tx.us/search/cf
 *
 * This connector is a simplified adapter of the legacy tecScraper.js,
 * focused on producing PolicyIntelSourceDocument + Stakeholder records.
 */
import axios from "axios";
import * as cheerio from "cheerio";

const TEC_BASE_URL = "https://www.ethics.state.tx.us";

// ── Types ────────────────────────────────────────────────────────────────────

export interface TecFilerRecord {
  filerId: string;
  filerName: string;
  filerType: string;
  sourceUrl: string;
}

export interface TecLobbyistRecord {
  name: string;
  registrationId: string;
  clients: string[];
  sourceUrl: string;
}

export interface TecFetchResult {
  filers: TecFilerRecord[];
  lobbyists: TecLobbyistRecord[];
  errors: string[];
}

// ── Fetch Functions ──────────────────────────────────────────────────────────

/**
 * Search TEC campaign finance filers by name.
 */
export async function searchTecFilers(name: string): Promise<TecFilerRecord[]> {
  const url = `${TEC_BASE_URL}/search/cf/`;
  const resp = await axios.post(
    url,
    new URLSearchParams({ searchType: "filerName", filerName: name, reportType: "ALL" }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 15000 },
  );

  const $ = cheerio.load(resp.data);
  const results: TecFilerRecord[] = [];

  $("table.searchResults tr").each((_i, row) => {
    const cols = $(row).find("td");
    if (cols.length >= 3) {
      const filerId = $(cols[0]).text().trim();
      const filerName = $(cols[1]).text().trim();
      const filerType = $(cols[2]).text().trim();
      if (filerId && filerName) {
        results.push({
          filerId,
          filerName,
          filerType,
          sourceUrl: `${TEC_BASE_URL}/search/cf/COH?filerID=${encodeURIComponent(filerId)}`,
        });
      }
    }
  });

  return results;
}

/**
 * Search TEC lobbyist registrations by name.
 */
export async function searchTecLobbyists(name: string): Promise<TecLobbyistRecord[]> {
  const url = `${TEC_BASE_URL}/search/lobby/`;
  const resp = await axios.post(
    url,
    new URLSearchParams({ searchType: "lobbyistName", lobbyistName: name }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 15000 },
  );

  const $ = cheerio.load(resp.data);
  const results: TecLobbyistRecord[] = [];

  $("table.searchResults tr").each((_i, row) => {
    const cols = $(row).find("td");
    if (cols.length >= 2) {
      const nameText = $(cols[0]).text().trim();
      const regId = $(cols[1]).text().trim();
      if (nameText && regId) {
        results.push({
          name: nameText,
          registrationId: regId,
          clients: [],
          sourceUrl: `${TEC_BASE_URL}/search/lobby/detail?regID=${encodeURIComponent(regId)}`,
        });
      }
    }
  });

  return results;
}

/**
 * Fetch both filers and lobbyists for a given search term.
 */
export async function fetchTecData(searchTerm: string): Promise<TecFetchResult> {
  const result: TecFetchResult = { filers: [], lobbyists: [], errors: [] };

  try {
    result.filers = await searchTecFilers(searchTerm);
  } catch (err: any) {
    result.errors.push(`Filer search error: ${err?.message ?? String(err)}`);
  }

  try {
    result.lobbyists = await searchTecLobbyists(searchTerm);
  } catch (err: any) {
    result.errors.push(`Lobbyist search error: ${err?.message ?? String(err)}`);
  }

  return result;
}
