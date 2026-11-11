export type Lang = "en" | "ja";
export type Bi = Record<Lang, string>;

export interface LoopStep {
  actor: "user" | "harness" | "model" | "tool";
  kind: "message" | "tool_call" | "tool_result" | "answer" | "system";
  title: Bi;
  body: string;
  explain: Bi;
  tokens: number;
}

export const LOOP_STEPS: LoopStep[] = [
  {
    actor: "harness", kind: "system", tokens: 2400,
    title: { en: "The harness sends instructions and tool definitions", ja: "ハーネスが指示とツール定義を送る" },
    body: 'system: "You are a coding agent..."\ntools: [run_tests, read_file, edit_file]',
    explain: { en: "Before the model sees the user's words, the program running it (the harness) sends a system prompt and a JSON schema for every tool. These tokens are paid on every request, which is why tool descriptions should be short and precise.", ja: "モデルがユーザーの言葉を見る前に、モデルを動かすプログラム(ハーネス)がシステムプロンプトと全ツールの JSON スキーマを送ります。これは毎回のリクエストで課金されるので、ツールの説明は短く正確にするのが大切です。" },
  },
  {
    actor: "user", kind: "message", tokens: 30,
    title: { en: "The user asks for something", ja: "ユーザーが依頼する" },
    body: "The date test is failing. Can you fix it?",
    explain: { en: "The request is appended as a user message. The model does not remember earlier runs; everything it knows arrives in this one growing list of messages.", ja: "依頼は user メッセージとして追加されます。モデルは以前の実行を覚えていません。知っていることはすべて、この伸び続けるメッセージ列で届きます。" },
  },
  {
    actor: "model", kind: "tool_call", tokens: 60,
    title: { en: "The model decides to call a tool", ja: "モデルがツール呼び出しを決める" },
    body: 'tool_use: run_tests\ninput: { "filter": "date" }',
    explain: { en: "The model cannot run anything itself. It replies with a structured request to call a tool, and stops. The stop reason is tool_use, which tells the harness it has work to do.", ja: "モデル自身は何も実行できません。ツールを呼びたいという構造化された返答をして止まります。停止理由は tool_use で、ハーネスに仕事があることを伝えます。" },
  },
  {
    actor: "tool", kind: "tool_result", tokens: 900,
    title: { en: "The harness runs the tool and returns the result", ja: "ハーネスがツールを実行し、結果を返す" },
    body: "FAIL date.test.ts\n  expected \"2026-11-05\"\n  received \"2026-11-04\"",
    explain: { en: "The harness executes the command in a sandbox, possibly after asking the user for permission, and appends the output as a tool_result. Tool output is usually the biggest consumer of the context window.", ja: "ハーネスはサンドボックスでコマンドを実行し(必要ならユーザーに許可を求め)、出力を tool_result として追加します。コンテキストウィンドウを最も消費するのは、たいていツールの出力です。" },
  },
  {
    actor: "model", kind: "tool_call", tokens: 50,
    title: { en: "The model reads the code", ja: "モデルがコードを読む" },
    body: 'tool_use: read_file\ninput: { "path": "src/date.ts" }',
    explain: { en: "One result often leads to the next call. Each round trip is a full request: the whole conversation so far is sent again. Prompt caching makes the repeated prefix cheap.", ja: "1つの結果が次の呼び出しにつながります。往復のたびに、それまでの会話全体が再送されます。プロンプトキャッシュを使うと、繰り返し部分が安くなります。" },
  },
  {
    actor: "tool", kind: "tool_result", tokens: 1800,
    title: { en: "The file contents come back", ja: "ファイルの中身が返ってくる" },
    body: "export function today() {\n  return new Date().toISOString().slice(0, 10);\n}",
    explain: { en: "toISOString uses UTC. In Tokyo before 9 a.m., the UTC date is still yesterday. The model can now see the bug.", ja: "toISOString は UTC を使います。東京の午前9時前は、UTC ではまだ前日です。これでモデルにバグが見えました。" },
  },
  {
    actor: "model", kind: "tool_call", tokens: 140,
    title: { en: "The model edits the file", ja: "モデルがファイルを編集する" },
    body: 'tool_use: edit_file\ninput: { "path": "src/date.ts",\n  "old": "toISOString().slice(0, 10)",\n  "new": "toLocaleDateString(\\"sv-SE\\")" }',
    explain: { en: "Edits are tool calls too. A careful harness asks before writing, or limits writes to the project folder.", ja: "編集もツール呼び出しです。慎重なハーネスは書き込み前に確認するか、書き込みをプロジェクトフォルダ内に制限します。" },
  },
  {
    actor: "tool", kind: "tool_result", tokens: 20,
    title: { en: "The edit is applied", ja: "編集が適用される" },
    body: "ok: 1 replacement",
    explain: { en: "Short results are good results. Tools that return only what the model needs leave room for the rest of the task.", ja: "短い結果は良い結果です。必要なものだけ返すツールは、残りの作業のための余地を残します。" },
  },
  {
    actor: "model", kind: "tool_call", tokens: 40,
    title: { en: "The model verifies", ja: "モデルが検証する" },
    body: 'tool_use: run_tests\ninput: { "filter": "date" }',
    explain: { en: "Good agents check their own work instead of declaring success.", ja: "良いエージェントは、成功を宣言する前に自分の作業を確かめます。" },
  },
  {
    actor: "tool", kind: "tool_result", tokens: 40,
    title: { en: "The tests pass", ja: "テストが通る" },
    body: "PASS date.test.ts (3 tests)",
    explain: { en: "Evidence, not assertion: the final answer can now point to a passing run.", ja: "主張ではなく証拠です。最終回答は、テストが通った実行結果を根拠にできます。" },
  },
  {
    actor: "model", kind: "answer", tokens: 90,
    title: { en: "The model answers and the loop ends", ja: "モデルが回答し、ループが終わる" },
    body: "Fixed: today() used UTC, so it returned yesterday's date in Tokyo before 9 a.m. It now uses the local date. The date tests pass.",
    explain: { en: "This time the stop reason is end_turn instead of tool_use, so the harness stops looping and shows the answer. That is the whole trick: a loop that runs until the model stops asking for tools.", ja: "今回の停止理由は tool_use ではなく end_turn なので、ハーネスはループを止めて回答を表示します。仕組みはこれだけです。モデルがツールを求めなくなるまで回り続けるループです。" },
  },
];

export const UI: Record<string, Bi> = {
  title: { en: "How a tool-calling agent works", ja: "ツールを使う AI エージェントの仕組み" },
  intro: { en: "Step through one agent run. Watch who acts at each step and how the context window fills.", ja: "エージェントの1回の実行をステップごとに追います。各ステップで誰が動き、コンテキストウィンドウがどう埋まるかを見てください。" },
  next: { en: "Next step", ja: "次へ" },
  back: { en: "Back", ja: "戻る" },
  restart: { en: "Start over", ja: "最初から" },
  context: { en: "Context window used", ja: "コンテキストウィンドウ使用量" },
  windowSize: { en: "Window size", ja: "ウィンドウサイズ" },
  compactTitle: { en: "When the window fills up", ja: "ウィンドウがいっぱいになると" },
  compactBody: { en: "Long tasks outgrow any window. Drag the slider to add more rounds of tool output. Past the threshold, the harness compacts: it replaces old turns with a summary and keeps going.", ja: "長い作業はどんなウィンドウにも収まりきらなくなります。スライダーでツール出力の往復を増やしてみてください。しきい値を超えると、ハーネスは古いやり取りを要約に置き換えて(コンパクション)作業を続けます。" },
  rounds: { en: "Extra rounds of tool output", ja: "追加のツール出力の往復" },
  compacted: { en: "Compacted: old turns replaced by a summary", ja: "コンパクション済み: 古いやり取りを要約に置換" },
  mcpTitle: { en: "Where MCP fits", ja: "MCP の位置づけ" },
  mcpBody: { en: "The Model Context Protocol standardizes the tool part. Instead of every app hard-coding its tools, an MCP server advertises them, and any MCP client can list and call them.", ja: "Model Context Protocol(MCP)は、ツールの部分を標準化します。アプリごとにツールを作り込む代わりに、MCP サーバーがツールを公開し、どの MCP クライアントからでも一覧取得・呼び出しができます。" },
  actor_user: { en: "User", ja: "ユーザー" },
  actor_harness: { en: "Harness", ja: "ハーネス" },
  actor_model: { en: "Model", ja: "モデル" },
  actor_tool: { en: "Tool", ja: "ツール" },
  step: { en: "Step", ja: "ステップ" },
  of: { en: "of", ja: "/" },
};

export const MCP_FLOW: { from: string; to: string; label: Bi }[] = [
  { from: "Client", to: "Server", label: { en: "initialize: which protocol version and features?", ja: "initialize: プロトコルのバージョンと機能を確認" } },
  { from: "Client", to: "Server", label: { en: "tools/list: what can you do?", ja: "tools/list: 何ができる?" } },
  { from: "Server", to: "Client", label: { en: "tools: names, descriptions, input schemas", ja: "tools: 名前・説明・入力スキーマ" } },
  { from: "Model", to: "Client", label: { en: "tool_use: call search_issues", ja: "tool_use: search_issues を呼ぶ" } },
  { from: "Client", to: "Server", label: { en: "tools/call: search_issues { query }", ja: "tools/call: search_issues { query }" } },
  { from: "Server", to: "Client", label: { en: "result: content blocks", ja: "result: コンテンツブロック" } },
  { from: "Client", to: "Model", label: { en: "tool_result goes back into the conversation", ja: "tool_result が会話に戻る" } },
];
