/**
 * Reusable Tailwind class bundles (GridWork pattern: styles live in JS, not CSS files).
 * Import and use as className={tw.adminCard} — keeps globals.css tiny.
 */
export const tw = {
  // Brand logo
  logoLink: 'inline-flex items-center no-underline text-inherit leading-none',
  logo: 'inline-block font-black whitespace-nowrap text-ink leading-none tracking-[-0.065em] font-heading',
  logoF:
    'admin-brand-f text-mint italic font-extrabold inline-block [transform:skewX(-6deg)]',
  logoXs: 'text-[15px]',
  logoSm: 'text-lg',
  logoMd: 'text-[26px]',
  logoLg: 'text-[32px]',
  logoXl: 'text-[44px] [text-shadow:0_0_40px_rgba(60,255,208,0.12)]',

  btnAccent:
    'inline-flex items-center justify-center px-3.5 py-2 rounded-sm border-0 bg-mint text-[var(--admin-accent-fg,#111)] text-[13px] font-medium cursor-pointer no-underline transition-colors duration-150 hover:bg-mint-hover',
  pillBtn:
    'inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-line bg-bg-elevated text-ink text-[13px] font-medium cursor-pointer no-underline transition-colors duration-150 hover:bg-bg-hover',
  heroCta:
    'inline-flex items-center justify-center px-4 py-2 rounded-sm border-0 bg-mint text-[var(--admin-accent-fg,#111)] text-[13px] font-medium cursor-pointer no-underline transition-colors duration-150 hover:bg-mint-hover',
  primaryBtn:
    'button-primary inline-flex items-center justify-center gap-1.5 min-h-[30px] px-2.5 border border-mint rounded-[3px] bg-mint text-[var(--admin-accent-fg,#111)] text-[13px] font-normal cursor-pointer no-underline hover:bg-mint-hover disabled:opacity-50 disabled:cursor-not-allowed',
  secondaryBtn:
    'inline-flex items-center justify-center gap-1.5 min-h-[30px] px-2.5 border border-line-strong rounded-[3px] bg-bg-elevated text-ink text-[13px] font-normal cursor-pointer no-underline hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed',
  iconBtn:
    'inline-flex items-center justify-center w-8 h-8 rounded-sm border-0 bg-transparent text-ink-secondary cursor-pointer no-underline transition-colors hover:text-ink hover:bg-bg-hover',
  iconBtnDanger:
    'inline-flex items-center justify-center w-8 h-8 rounded-sm border-0 bg-transparent text-ink-tertiary cursor-pointer transition-colors hover:text-[var(--danger)] hover:bg-[var(--danger-soft)]',
  iconBtnApprove:
    'inline-flex items-center justify-center w-8 h-8 rounded-sm border-0 bg-transparent text-mint cursor-pointer transition-colors hover:bg-mint/10',

  pageShell: 'w-full min-h-screen bg-black text-white m-0 mx-auto',
  pageShellAdmin: 'admin-xai w-full min-h-screen bg-bg text-ink m-0 p-0 max-w-none relative',
  adminShell: 'admin-shell flex min-h-0 flex-1 w-full overflow-hidden bg-bg m-0 p-0',
  adminContent: 'flex min-h-0 min-w-0 flex-1 flex-col bg-bg m-0',
  adminContentInner: 'min-h-0 flex-1 overflow-y-auto',
  adminView: 'wp-wrap',
  adminSection: 'postbox',
  adminSectionTitle: 'hndle m-0 px-3 py-2.5 text-[14px] font-semibold text-ink border-b border-line',
  adminSectionDesc: 'm-0 mb-3 px-3 pt-3 text-[13px] leading-relaxed text-ink-secondary max-w-[62ch]',
  adminGrid: 'grid grid-cols-1 min-[901px]:grid-cols-[1fr_1.4fr] gap-4 items-start',
  adminGrid2: 'grid grid-cols-1 min-[901px]:grid-cols-2 gap-4',
  adminTopbar: 'flex h-12 shrink-0 items-center gap-3 border-b border-line bg-bg-elevated px-3 md:px-6',
  adminMe: 'text-[13px] text-ink-secondary',
  adminTitleRow: 'flex flex-col gap-2 mb-4',
  accentLine: 'h-px w-12 bg-mint/50',

  card: 'rounded-sm border border-line bg-bg-elevated p-5 min-w-0',
  cardFull: 'rounded-sm border border-line bg-bg-elevated p-5 w-full min-w-0',
  cardTitle:
    'text-[13px] font-semibold text-ink m-0 mb-3 tracking-tight pb-3 border-b border-line',
  cardDesc: 'text-[13px] text-ink-secondary -mt-1 mb-3 leading-snug',
  sideCard:
    'rounded-sm border border-line bg-bg-elevated p-4 min-w-0',
  sideHeader: 'flex items-baseline justify-between gap-3 mb-3 pb-2.5 border-b border-line',
  titleCount:
    'text-[11px] font-medium text-ink-secondary bg-[var(--chip)] border border-line px-2 py-0.5 rounded-sm',
  titleGroup: 'flex flex-col gap-3 min-w-0',
  headerActions: 'flex items-center gap-2 flex-wrap',

  // Forms
  form: 'flex flex-col gap-3.5',
  formGroup: 'flex flex-col gap-1.5',
  formLabel: 'text-[14px] font-semibold text-ink',
  formInput:
    'h-[30px] px-2 border border-line-strong rounded-[3px] bg-bg-elevated text-ink text-[14px] outline-none w-full placeholder:text-ink-muted focus:border-mint focus:shadow-[0_0_0_1px_var(--mint)]',
  formTextarea:
    'min-h-[88px] p-2.5 border border-line-strong rounded-sm bg-bg-elevated text-ink text-[13px] outline-none w-full resize-y transition-shadow placeholder:text-ink-muted focus:border-mint focus:shadow-[0_0_0_1px_var(--mint)]',
  formSelect:
    'h-8 px-2 border border-line-strong rounded-sm bg-bg-elevated text-ink text-[13px] outline-none w-full transition-shadow focus:border-mint focus:shadow-[0_0_0_1px_var(--mint)]',
  formHint: 'text-xs text-ink-tertiary mt-1',
  formHintSuccess: 'text-[13px] text-mint m-0',
  disabledInput: 'opacity-55 cursor-not-allowed',

  tableWrap: 'w-full overflow-x-auto border border-line bg-bg-elevated',
  table: 'wp-table',
  th: '',
  td: '',
  trHover: '',
  textMuted: 'text-ink-secondary',
  textRight: 'text-right',

  tabs: 'subsubsub',
  tab: 'border-0 bg-transparent p-0 text-mint text-[13px] cursor-pointer hover:text-mint-hover',
  tabActive: 'current font-semibold text-ink hover:text-ink',
  pagination: 'flex items-center justify-center gap-3 mt-4 pt-3',
  pageBtn:
    'inline-flex items-center justify-center min-w-8 h-8 px-2.5 border border-line rounded-sm bg-bg-elevated text-ink text-[13px] cursor-pointer hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed',
  pageInfo: 'text-[13px] text-ink-secondary',

  // Modal + toast
  modalOverlay: 'admin-modal-overlay',
  modalContent: 'admin-modal-dialog',
  modalHeader: 'flex items-center justify-between gap-3 px-5 pt-5',
  modalTitle: 'm-0 text-[17px] font-semibold tracking-tight text-ink',
  modalBody: 'px-5 pt-3.5 pb-1.5 text-ink-secondary leading-relaxed text-sm',
  modalWarning: 'text-[#c44848] text-xs mt-2.5',
  modalActions:
    'flex justify-end items-center flex-wrap gap-2.5 px-5 py-4 border-t border-line mt-2',
  toast:
    'fixed bottom-6 right-6 z-[1300] flex items-center gap-2.5 px-4 py-3 rounded-sm border border-line bg-bg-elevated text-ink shadow-[var(--shadow-float)]',
  toastSuccess: 'border-mint/40',
  toastIcon: 'text-mint font-bold',
  toastMessage: 'text-[13px] text-ink',
  emptyState: 'text-ink-secondary text-center py-10 px-4 text-[13px]',

  editorShell: 'flex min-h-0 flex-1',
  editorCard: 'min-w-0 flex-1 overflow-y-auto',
  editorToolbar: 'flex flex-wrap items-center gap-0',
  editorToolBtn:
    'inline-flex items-center justify-center size-10 rounded-sm border-0 bg-transparent text-ink-secondary text-xs font-semibold cursor-pointer transition-colors hover:bg-[var(--chip)] hover:text-ink disabled:opacity-30',
  editor:
    'min-h-[280px] w-full bg-transparent text-ink outline-none',
  editorSidebar: 'flex w-[min(100%,280px)] shrink-0 flex-col border-l border-line bg-bg-elevated',
  editorSidebarHeader: 'font-semibold text-[13px] text-ink',
  editorSidebarContent: 'space-y-3',

  // Dashboard widgets
  barsContainer:
    'flex items-end justify-between gap-3 h-[220px] px-2 pt-4 pb-2 mt-2 border-t border-line',
  barItem: 'flex-1 flex flex-col items-center gap-2.5 min-w-0 h-full',
  barWrapper:
    'flex-1 w-full max-w-12 flex items-end justify-center bg-[var(--chip)] border border-line overflow-hidden relative',
  barFill:
    'w-full min-h-[12%] bg-mint rounded-t flex items-start justify-center pt-1.5 transition-all',
  barValue: 'text-[11px] font-bold text-[var(--admin-accent-fg,#111)] leading-none',
  barLabel: 'text-[11px] font-medium tracking-wide uppercase text-ink-secondary whitespace-nowrap',
  trendList: 'flex flex-col gap-2.5 max-h-[280px] overflow-y-auto',
  trendItem: 'p-3 border-b border-line last:border-0',
  trendHeader: 'flex items-center justify-between gap-2.5 mb-1.5',
  trendPost: 'text-xs font-semibold text-ink truncate min-w-0',
  trendLikes: 'text-[11px] font-semibold text-ink whitespace-nowrap shrink-0',
  trendPreview: 'm-0 text-[13px] text-ink-secondary leading-snug',
  memberList: 'flex flex-col gap-2',
  memberItem:
    'flex items-center justify-between gap-3 px-3 py-2.5 border-b border-line last:border-0',
  memberName: 'font-semibold text-ink block',
  memberRole: 'text-[11px] text-ink-secondary uppercase tracking-wide',
  memberCount: 'text-xl font-bold text-ink mr-1.5',
  memberUnit: 'text-[11px] text-ink-muted uppercase tracking-wide',

  // Media upload
  mediaGrid: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3',
  uploadArea:
    'border border-dashed border-line rounded-sm p-8 text-center bg-bg-elevated hover:border-mint transition-colors cursor-pointer',
  uploadIcon: 'text-3xl text-mint mb-2',
  uploadText: 'text-sm text-ink-secondary',

  // Posts list bits
  postCell: 'flex items-center gap-3 min-w-0',
  postThumb: 'w-[52px] h-10 overflow-hidden bg-[var(--chip)] border border-line shrink-0',
  actionGroup: 'flex gap-2 justify-end',
  cardHeader: 'flex items-center justify-between mb-3 pb-3 border-b border-line',
  cardSubtitle: 'block text-xs text-[#777] mt-1',
  statusBadge:
    'inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide',
  spin: 'animate-spin',
  mt32: 'mt-8',
  fullWidth: 'w-full',
  dot: 'w-2 h-2 rounded-full inline-block bg-white shadow-[0_0_8px_rgba(255,255,255,0.45)]',
  hl: 'bg-bg-highlight px-[0.1em] [box-decoration-break:clone]',
  metaAuthor: 'uppercase text-white font-bold text-meta tracking-wider',
};
