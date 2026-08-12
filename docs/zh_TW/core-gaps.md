# 核心涵蓋範圍稽核 — 與傳統 wp-admin 的差距

已於 2026-07-10 針對 v0.10.0 完成稽核；2026-07-12 在
v0.13.0 週期（WP 7.0.1）；2026-07-13 於 v0.14.0 重新檢查，結果為開放；輕量
2026-07-15 於 v0.16.0 重新檢查，結果為開放；2026-07-23 於 v0.21.0 重新檢查，結果為開放
（留言編輯＋封鎖留言者、網站標誌與網站語言全部
已在 v0.20.0 週期發布；下方區段已更新）；重新檢查
於 v0.22.0 開放日 2026-07-24（唯讀資料庫檢視器已作為
原生開發者介面，詳見下方 Tools；不新增日常工作
缺口）：每個
既定的優先順序仍維持已發布狀態，核心區域沒有新的日常工作缺口。
已於 2026-07-30 在 v0.23.0 開放版本重新稽核，聚焦主題整合（請參閱
下方的新區段）：其餘 wp-admin 領域具有佈景主題形態
（區塊主題 Site Editor 成果、建構器主題範本）以及另外四項
較小的營運缺口（每個擴充功能的自動更新切換、佈景主題即時
預覽、批次編輯分類／作者、同步模式可見度）。開發工具 Wave A 已完成
（Diagnostics 系列）；進一步的盤點工作屬於介面卡深度，或暫緩
原生介面（`plugin-support.md`、`native-editors.md`）。重新檢查
於 v0.24.0 開放日 2026-08-06（未發布）：這四項較小的缺口中有三項
已在 v0.23.0 週期發布（自動更新切換、佈景主題即時預覽、
同步模式；下方已標記），以及 Media 區段的資料夾判定
已過時：優先瀏覽的提供者契約（Wave D）早已
已在 v0.18.0 週期發布，以下已修正。v0.24.0 週期目前
是介面卡深度（WPForms entries、表單狀態卡、FluentSMTP），並且
不會改變核心缺口狀態。仍開放：區塊主題介面、建構器
佈景主題範本、批次編輯分類／作者。Minimal 的
定位評分如下：日常工作歸入 Minimal，長尾需求則保留
在 wp-admin 中只需一鍵即可使用。下方每個區域都會獲得狀態，以及對
缺口是否阻礙日常工作。
positioning grades these: daily work belongs in Minimal, the long tail stays
優先級排名（重要的缺口）
whether the gap blocks daily work.

## Priority ranking (the gaps that matter)

1. 建立／編輯（名稱、代稱、父項目、說明），刪除時提供誠實的
   (Manage → Terms, `/minimal-admin/terms`) covers every REST-enabled taxonomy
   （文章會透過核心本身的重新指派功能移至仍存在的詞彙
   機制，接著刪除來源）。編輯器可透過
   confirms, count links into the filtered content list, and **merge**
   REST 路由。
   **媒體標題與說明** — ✅ 已推出（v0.11.0 週期）：媒體
   `manage_categories`; per-taxonomy capabilities are enforced by core's
   攜帶編輯內容的原始值（延遲擷取，使清單維持
2. 淺色）以及透過 wp/v2/media 儲存。
   **媒體批次選取／刪除** — ✅ 已推出（v0.11.0 週期）：網格項目與
   清單列帶有核取方塊（Shift 範圍選取、全選）與刪除列
   比照內容清單模式；force=true，逐項處理。
3. **留言批次審核** — ✅ 已推出（v0.11.0 週期）：留言列取得
   核取方塊＋選取頁面，以及一個動作列，其動詞是目前分頁本身的
   動作（Pending 上的 Approve／Spam／Trash、Trash 上的 Restore／Delete，以及其他
4. 上），逐項套用。
   **批次變更使用者角色** — ✅ 已推出（v0.11.0 週期）：使用者表格
   增加核取方塊欄（受 edit-users 限制），以及可變更每個項目的列
   立即變更所選使用者的角色；目前使用者會被跳過（避免自我鎖定
5. 防護）。
   **每篇文章的格式選擇器** — ✅ 已推出（v0.11.0 週期）：編輯器側邊欄
   具有 Format 選擇器，受目前主題宣告 post-format
   guard).
6. 欄位。啟動載荷會攜帶支援的格式。
   has a Format select, gated on the active theme declaring post-format
   support (matching wp-admin), saving through wp/v2's native `format`
   field. Boot payload carries the supported formats.

## 已涵蓋：網站識別資料位於 Settings → General（標題、標語、網站圖示

### Settings → Reading（最新文章或靜態頁面，含頁面選擇器）；截至
Covered: site identity lives in Settings → General (title, tagline, site icon
「Additional CSS」）會在 Settings → Design 中編輯
Settings → Reading (latest posts vs static page, with page pickers); and as of
the v0.11.0 cycle, **Custom CSS** (`wp_custom_css_post`, the Customizer's
語言已在 v0.20.0 週期推出（Settings → Site：標誌受限於
透過 `minimal-admin/v1/custom-css` 支援佈景主題自訂標誌，語言
validation mirroring the Customizer's refusal). Custom logo and site
佈景主題模組、FSE 全域樣式。判定：識別資訊＋首頁＋Custom CSS＋
theme custom-logo support via `minimal-admin/v1/site-logo`, the language over
`minimal-admin/v1/site/language`, downloading packs on save). Missing: other
theme mods, FSE global styles. Judgment: identity + homepage + Custom CSS +
外觀 — 在關鍵位置已涵蓋
Menus（含拖曳重新排序）與傳統小工具已完整建置；主題

### 背景與頁首圖片：依設計不在範圍內。
Menus (with drag reorder) and classic widgets are fully built; themes
主題整合 — 已稽核的前沿（2026-07-30）
在 CLASSIC 主題上，日常範圍已涵蓋：Menus、Widgets、標誌、圖示、

### 已於 v0.23.0 進行實證驗證：
On a CLASSIC theme, the daily slice is covered: Menus, Widgets, logo, icon,
**區塊主題在沒有替代方案時失去優勢（L，需要設計）。**
verified empirically at v0.23.0:

1. **Block themes lose ground with no replacement (L, needs design).**
   Minimal correctly hides Menus and Widgets when `wp_is_block_theme()`
   (`B.site.blockTheme`), but nothing steps in: no navigation editing
   (`wp_navigation` posts have REST parity with what the Menus manager
   在此項目內排序：導覽優先（實際日常工作、現有
   Menus UX 轉移），接著是唯讀 Design 卡片（啟用中的主題及其
   範本／部分顯示為「Edit in Site Editor ↗」列，目前的調色盤）。
   Site Editor 畫布本身是永久的外部連結（理由與
   表單建構器）。
   templates/parts as "Edit in Site Editor ↗" rows, current palette). The
   Site Editor canvas itself is a permanent link-out (same reasoning as
   會跳過它，也就是說標頭／頁尾位於 Elementor Theme 中的網站
2. **Builder theme templates are invisible (M).** `elementor_library` IS
   REST-exposed but not `viewable`, so the content switcher (rightly)
   核心主張：列出、標示類型（標頭／頁尾／彈出視窗／封存），顯示
   顯示條件為唯讀，並深層連結至建構器畫布。
   ~~**每個擴充功能的自動更新切換（S）。**~~ **已於 2026-08-04 發布**
   （v0.23.0 週期）：外掛與主題卡片都透過
   display conditions read-only, deep-link into the builder canvas.
3. ~~**Per-extension auto-update toggles (S).**~~ **SHIPPED 2026-08-04**
   (v0.23.0 cycle): Auto pills on plugin AND theme cards through
   `minimal-admin/v1/auto-updates` (the same option writes as
   `wp_ajax_toggle_auto_updates`, stale entries pruned; gated on
   `wp_is_auto_update_enabled_for_type` server- and client-side). Suite
   `tests/auto-updates.test.js`.
4. ~~**Theme live preview (S).**~~ **SHIPPED 2026-08-04** (v0.23.0
   **超出狀態的批次編輯（M）。** 內容批次列可處理狀態／
   classic themes, `site-editor.php?wp_theme_preview=` for block themes
   (the `block` flag now rides `minimal-admin/v1/themes`).
5. ~~**同步模式（S-M）。**~~ **已於 2026-08-04 發布**（v0.23.0 週期）：
   trash / restore / delete but not wp-admin bulk-edit's "add these
   Content 切換器中的 Patterns 項目，具備標準列機制
6. （前端檢視／預覽已抑制，無法公開查詢）；斜線
   選單＋⌘/ 選擇器「Your patterns」（已同步 → `slimContentTypes`
   參照區塊、靜默插入；未同步 → 透過
   (front-end view/preview suppressed, not publicly queryable); slash
   menu + ⌘/ picker "Your patterns" (synced → `wp:block {"ref":N}`
   reference island, quiet insert; unsynced → detached copy via
   `insertPatternIslands`); editor opens `/editor/blocks/{id}` natively
   with a synced-edit note and self-slimmed sidebar; + New → Pattern.
   GOTCHA: `wp_pattern_sync_status` is top-level READ-only in REST;
   writes ride `meta.wp_pattern_sync_status`. Suite
   `tests/user-patterns.test.js`.
7. 誠實的答案，判定與先前相同。
   theme mods (colors, header/background images, per-theme sections) are
   分類法 — 已涵蓋
   Terms 管理器已於 2026-07-10 推出（請參閱優先級 #1）。唯一的伺服器

### 截至 v0.11.0 週期，Terms 已併入 **Structure** 頁面（Post
Types／Taxonomies／Terms 分頁，而不是獨立的導覽項目，以便維持
addition was `minimal-admin/v1/terms/merge`; everything else rides core REST.
As of the v0.11.0 cycle, Terms is folded into the **Structure** page (Post
編輯器的 Structure 項目只顯示 Terms 分頁（標示為「Terms」以
the MANAGE group short. The tabs gate individually: Post Types and
Taxonomies need `manage_options`, Terms needs only `manage_categories`, so
an editor's Structure item shows just the Terms tab (labeled "Terms" for
them), while an admin sees all three. The `/minimal-admin/terms` route and the
System 頁面完整涵蓋診斷功能（健康檢查、資料庫表格、自動載入

### 擴充功能資訊清單、複製為 Markdown 的報告）。Loopback 與 REST 自我檢查
健康列已於 2026-07-10 推出（核心自身的 Site Health 測試，快取 15
分鐘），Tools 卡片會深層連結至一次性工作（Site Health、
匯出／匯入、GDPR 匯出／刪除）：偶發性處理仍留在 wp-admin，一
依設計離開。自 v0.22.0 週期起，Database 卡片也成為
入口：其最大資料表列與「瀏覽全部」連結會開啟唯讀
export/import, GDPR export/erase): episodic surgery stays in wp-admin, one
項目）。寫入功能與 SQL 主控台在此仍是永久的非目標
doorway: its largest-table rows and a "browse all" link open the read-only
database viewer (`/minimal-admin/database`, also in ⌘K; deliberately not a nav
Settings — 日常選項已涵蓋，兩個畫面較薄弱
(`native-editors.md`).

### 管理員）、Writing（預設分類／格式、表情符號）、Reading（首頁、
每頁文章數、搜尋可見度）、Discussion（預設留言／引用狀態、
審核、需要註冊、啟用／停用頭像）、Permalinks（結構＋
基礎）、Spam（提供者卡片＋不允許的金鑰）、Connectors（WP 7.0 的
連接器登錄：提供者金鑰由核心端遮罩與驗證，
針對 wp-config／env 金鑰的來源誠實性、伴隨外掛安裝於
位置），並在 Site 分頁加入網站標誌與網站語言，因為 v0.20.0
週期。缺少：整個 Media
設定畫面（縮圖大小、月份／年份資料夾）、
place), plus site logo and site language on the Site tab since the v0.20.0
深度、每頁數量、先前核准的捷徑、關閉後天數、通知
電子郵件、頭像評分／預設）。判斷：缺少的是一次設定的組態；
`posts_per_rss` / feed excerpt, and most of the Discussion matrix (threading
depth, per-page, previously-approved shortcut, close-after-days, notification
使用者 — 已達到或超越對等程度
清單、搜尋、角色、新增／編輯、刪除並重新指派內容、密碼

### 應用程式密碼（「AI Access」含產生的代理指南）。
所有長尾個人資料欄位已於 v0.17.0 在 /minimal-admin/profile 推出
頁面（名字、姓氏、個人簡介、網站、每位使用者的語言與自動
套件安裝、前端工具列偏好設定）。應用程式密碼
以及刪除時重新指派，比傳統介面呈現得更好。
page (first/last name, bio, website, per-user language with automatic
媒體 — 網格穩固，編輯功能已跟上
具備類型篩選／搜尋／分頁的網格、多檔上傳、拖放、圖片

### 標題／說明編輯與批次刪除（兩者皆已於 v0.11.0 推出）。
未附加篩選器（核心 parent=0）、月份篩選器（minimal-admin/v1/media/months
組合框 → 前後時間範圍）以及詳細資料視窗的「Attached to」列
搭配編輯器跳轉功能的項目已於 2026-07-17 全部發布（v0.18.0 週期、套件
media-polish）。資料夾：不是
核心功能（Minimal 擁有的樹狀結構會成為第五種資料夾標準，且不可見
至 wp-admin 與建構器選擇器），但先前「長尾、跳過」的判定
已於 2026-07-16 修訂：FileBird＋Real Media Library＋Folders 合計超過 400k
安裝，因此以瀏覽優先的提供者合約成為 Wave D 的一部分
to wp-admin and builder pickers), but the earlier "long-tail, skip" verdict
was revised 2026-07-16: FileBird + Real Media Library + Folders total 400k+
installs, so a browse-first provider contract became Wave D in
`docs/plugin-support.md`. Wave D shipped 2026-07-17 (v0.18.0 cycle): the
`minimal_admin_media_folders` provider filter
(`includes/adapters/media-folders.php`) with bundled FileBird, Real Media
Library and Folders by Premio providers; a folder picker on the Media view
filters the normal wp/v2/media query (search, type tabs, Unattached and
自己的資料夾樹。
action rides each provider's optional `move` callable. Suite
`tests/media-folders.test.js`. Moving stays browse-first: Minimal never owns
待審核／已核准／垃圾／回收桶分頁，完整的逐列審核，批次

### （像核心功能一樣自動核准）、內容選單。最後兩個缺口已在
v0.20.0 週期：內嵌留言編輯（文字始終可編輯；作者姓名／電子郵件可供
訪客留言）與封鎖留言者（將作者的電子郵件或 IP 新增至
核心的不允許清單，可在 Settings → Comments 中查看，並提供 Undo）。
v0.20.0 cycle: inline comment editing (text always; author name/email for
多網站 — 非目標，但能合理降級
core's disallowed list, visible under Settings → Comments, with Undo).

### 子網站。
Minimal boots on main sites and subsites, heals routes after network activation,
結構觀察 — 僅限 REST 是硬性邊界
任何未公開至 REST 的內容，依設計對 Minimal 而言都是不可見的：CPT 與
changes, add-existing-account and remove-membership actions; network
自訂狀態。這是刻意如此，而且值得保留；這就是

Network administrators get first-class Sites, Network users and Network
settings surfaces. The daily slice covers site creation and lifecycle,
network-administrator promotion and revocation, registration, uploads, site
administrator permissions and network mail. Extensions adds network-wide
plugin activation and theme availability, and a core update runs the required
database migration across each subsite.

The boundary is deliberate: network account creation/deletion, welcome
emails, first-post text, reserved names, language defaults, restores, exports
and network setup stay in WordPress Network Admin. Very large networks use
WordPress's Upgrade Network screen rather than a request-bound site walk.
Network-shared logs, database tables and plugin data are either scoped by site
or restricted to super administrators; a per-site `manage_options` check is
never treated as permission to read the whole network.

### Structural observation — REST-only is a hard boundary
Anything not exposed to REST is invisible to Minimal by construction: CPTs and
taxonomies without `show_in_rest` (the UI flags them), meta not registered,
custom statuses. This is deliberate and worth keeping; it's the line that
keeps list views fast and safe.
