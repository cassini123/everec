import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import type { GraphEdge, GraphNode, GraphNodeType, ProjectGraph } from "@everec/shared";

const require = createRequire(import.meta.url);

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "everec-knowgo")
  : path.join(process.cwd(), "data", "knowgo");

const DB_PATH = path.join(DATA_DIR, "project-graph.db");
const GRAPHS_DIR = path.join(DATA_DIR, "graphs");

type SqliteDatabase = import("better-sqlite3").Database;

let db: SqliteDatabase | null = null;

function useSqlite(): boolean {
  return process.env.KNOWGO_GRAPH_STORE !== "json" && !process.env.VERCEL;
}

function getDb(): SqliteDatabase {
  if (!useSqlite()) {
    throw new Error("SQLite graph store is disabled");
  }
  if (db) return db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const Database = require("better-sqlite3") as typeof import("better-sqlite3").default;
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS graph_nodes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      props TEXT NOT NULL DEFAULT '{}',
      ref_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_gn_project ON graph_nodes(project_id);
    CREATE INDEX IF NOT EXISTS idx_gn_type ON graph_nodes(project_id, type);
    CREATE INDEX IF NOT EXISTS idx_gn_ref ON graph_nodes(project_id, ref_id);

    CREATE TABLE IF NOT EXISTS graph_edges (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      from_id TEXT NOT NULL,
      to_id TEXT NOT NULL,
      type TEXT NOT NULL,
      props TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ge_project ON graph_edges(project_id);

    CREATE TABLE IF NOT EXISTS graph_meta (
      project_id TEXT PRIMARY KEY,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}

function rowToNode(row: Record<string, unknown>): GraphNode {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    type: row.type as GraphNodeType,
    label: String(row.label),
    props: JSON.parse(String(row.props || "{}")) as Record<string, unknown>,
    refId: row.ref_id ? String(row.ref_id) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    version: Number(row.version),
  };
}

function rowToEdge(row: Record<string, unknown>): GraphEdge {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    from: String(row.from_id),
    to: String(row.to_id),
    type: row.type as GraphEdge["type"],
    props: row.props ? (JSON.parse(String(row.props)) as Record<string, unknown>) : undefined,
    createdAt: String(row.created_at),
  };
}

export function sqliteLoadGraph(projectId: string): ProjectGraph | null {
  if (!useSqlite()) return null;
  const database = getDb();
  const meta = database
    .prepare("SELECT updated_at FROM graph_meta WHERE project_id = ?")
    .get(projectId) as { updated_at: string } | undefined;
  if (!meta) return null;

  const nodes = database
    .prepare("SELECT * FROM graph_nodes WHERE project_id = ?")
    .all(projectId)
    .map((r) => rowToNode(r as Record<string, unknown>));

  const edges = database
    .prepare("SELECT * FROM graph_edges WHERE project_id = ?")
    .all(projectId)
    .map((r) => rowToEdge(r as Record<string, unknown>));

  return { projectId, nodes, edges, updatedAt: meta.updated_at };
}

export function sqliteSaveGraph(graph: ProjectGraph): void {
  if (!useSqlite()) return;
  const database = getDb();
  const updatedAt = new Date().toISOString();
  const tx = database.transaction(() => {
    database.prepare("DELETE FROM graph_nodes WHERE project_id = ?").run(graph.projectId);
    database.prepare("DELETE FROM graph_edges WHERE project_id = ?").run(graph.projectId);

    const insertNode = database.prepare(`
      INSERT INTO graph_nodes (id, project_id, type, label, props, ref_id, created_at, updated_at, version)
      VALUES (@id, @projectId, @type, @label, @props, @refId, @createdAt, @updatedAt, @version)
    `);
    for (const n of graph.nodes) {
      insertNode.run({
        id: n.id,
        projectId: n.projectId,
        type: n.type,
        label: n.label,
        props: JSON.stringify(n.props),
        refId: n.refId ?? null,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        version: n.version,
      });
    }

    const insertEdge = database.prepare(`
      INSERT INTO graph_edges (id, project_id, from_id, to_id, type, props, created_at)
      VALUES (@id, @projectId, @from, @to, @type, @props, @createdAt)
    `);
    for (const e of graph.edges) {
      insertEdge.run({
        id: e.id,
        projectId: e.projectId,
        from: e.from,
        to: e.to,
        type: e.type,
        props: e.props ? JSON.stringify(e.props) : null,
        createdAt: e.createdAt,
      });
    }

    database
      .prepare(
        "INSERT INTO graph_meta (project_id, updated_at) VALUES (?, ?) ON CONFLICT(project_id) DO UPDATE SET updated_at = excluded.updated_at",
      )
      .run(graph.projectId, updatedAt);
  });
  tx();
}

export function sqliteDeleteGraph(projectId: string): void {
  if (!useSqlite()) return;
  const database = getDb();
  database.prepare("DELETE FROM graph_nodes WHERE project_id = ?").run(projectId);
  database.prepare("DELETE FROM graph_edges WHERE project_id = ?").run(projectId);
  database.prepare("DELETE FROM graph_meta WHERE project_id = ?").run(projectId);
}

export function migrateJsonGraphToSqlite(projectId: string): ProjectGraph | null {
  if (!useSqlite()) return null;
  fs.mkdirSync(GRAPHS_DIR, { recursive: true });
  const fp = path.join(GRAPHS_DIR, `${projectId}.json`);
  if (!fs.existsSync(fp)) return null;
  const graph = JSON.parse(fs.readFileSync(fp, "utf-8")) as ProjectGraph;
  sqliteSaveGraph(graph);
  fs.renameSync(fp, `${fp}.migrated`);
  return graph;
}

export function graphStoreBackend(): "sqlite" | "json" {
  return useSqlite() ? "sqlite" : "json";
}
