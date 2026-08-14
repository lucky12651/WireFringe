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
  logoSm: 'text-lg',
  logoMd: 'text-[26px]',
  logoLg: 'text-[32px]',
  logoXl: 'text-[44px] [text-shadow:0_0_40px_rgba(60,255,208,0.12)]',

  // Buttons — x.ai: white primary, ghost secondary
  btnAccent:
    'inline-flex items-center justify-center px-4 py-2.5 rounded-md border-0 bg-white text-black text-xs font-bold tracking-wide cursor-pointer no-underline transition-all duration-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.35)] hover:bg-mint-hover hover:shadow-[0_0_24px_rgba(255,255,255,0.12)] hover:-translate-y-px',
  pillBtn:
    'inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-line bg-bg-elevated text-ink text-xs font-semibold tracking-wide cursor-pointer no-underline transition-all duration-200 hover:bg-bg-hover hover:border-line-strong',
  heroCta:
    'inline-flex items-center justify-center px-[18px] py-2.5 rounded-md border-0 bg-ink text-[var(--bg)] text-xs font-bold tracking-wide cursor-pointer no-underline transition-all duration-200 hover:opacity-90 hover:-translate-y-px',
  primaryBtn:
    'inline-flex items-center justify-center gap-2 h-[42px] px-[18px] border-0 rounded-md bg-ink text-[var(--bg)] text-xs font-bold tracking-[0.04em] cursor-pointer no-underline transition-all hover:opacity-90 hover:-translate-y-px',
  secondaryBtn:
    'inline-flex items-center justify-center gap-2 h-[42px] px-4 border border-line rounded-md bg-transparent text-ink-secondary text-[11px] font-semibold tracking-wide cursor-pointer no-underline transition-all hover:text-ink hover:border-line-strong hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed',
  iconBtn:
    'inline-flex items-center justify-center w-9 h-9 rounded-lg border border-line bg-bg-elevated text-ink-secondary cursor-pointer no-underline transition-all hover:text-ink hover:border-line-strong hover:bg-bg-hover',
  iconBtnDanger:
    'inline-flex items-center justify-center w-9 h-9 rounded-lg border border-line bg-white/[0.03] text-[#aaa] cursor-pointer transition-all hover:text-[#ff6b6b] hover:border-[#ff6b6b]/40 hover:bg-red-500/10',
  iconBtnApprove:
    'inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/20 bg-white/[0.08] text-white cursor-pointer transition-all hover:bg-white/15 hover:border-white/40',

  // Layout shells
  pageShell: 'w-full min-h-screen bg-black text-white m-0 mx-auto',
  pageShellAdmin: 'admin-xai w-full min-h-screen bg-bg text-ink m-0 p-0 max-w-none relative',
  adminShell: 'admin-shell flex min-h-screen w-full bg-transparent m-0 p-0 max-md:flex-col max-md:pb-[72px]',
  adminContent: 'flex-1 py-8 px-9 pb-14 w-full min-w-0 bg-transparent m-0 max-w-none max-md:px-4 max-md:py-5',
  adminContentInner: 'max-w-[1280px] mx-auto animate-fade-up',
  adminView: 'flex flex-col gap-0 animate-fade-up',
  adminSection: 'py-7 border-b border-line last:border-b-0 last:pb-0',
  adminSectionTitle: 'm-0 mb-1 text-[15px] font-semibold tracking-tight text-ink',
  adminSectionDesc: 'm-0 mb-5 text-[13px] leading-relaxed text-ink-secondary max-w-[62ch]',
  adminGrid: 'grid grid-cols-1 min-[901px]:grid-cols-[1fr_1.4fr] gap-4 items-start',
  adminGrid2: 'grid grid-cols-1 min-[901px]:grid-cols-2 gap-4',
  adminTopbar: 'flex items-center justify-between gap-4 px-6 py-4 border-b border-line bg-bg',
  adminMe: 'text-sm text-ink-secondary',
  adminTitleRow: 'flex flex-col gap-2 mb-5',
  accentLine: 'h-px w-12 bg-white/40 rounded-full',

  // Cards — glass-soft elevated panels
  card: 'rounded-xl border border-line bg-white/[0.03] backdrop-blur-sm p-[22px] shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-[border-color,box-shadow,background] duration-200 hover:border-white/15 hover:bg-white/[0.045] min-w-0',
  cardFull: 'rounded-xl border border-line bg-white/[0.03] backdrop-blur-sm p-[22px] shadow-[0_8px_32px_rgba(0,0,0,0.35)] w-full min-w-0',
  cardTitle:
    'text-[15px] font-semibold text-white m-0 mb-4 tracking-tight pb-3 border-b border-line',
  cardDesc: 'text-[13px] text-[#888] -mt-2 mb-4 leading-snug',
  sideCard:
    'rounded-xl border border-line bg-white/[0.03] backdrop-blur-sm p-5 min-w-0 shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-colors hover:border-white/15',
  sideHeader: 'flex items-baseline justify-between gap-3 mb-4 pb-3 border-b border-line',
  titleCount:
    'text-[11px] font-semibold tracking-wider uppercase text-white/90 bg-white/[0.06] border border-white/12 px-3 py-1.5 rounded-full',
  titleGroup: 'flex flex-col gap-3 min-w-0',
  headerActions: 'flex items-center gap-2.5 flex-wrap',

  // Forms
  form: 'flex flex-col gap-3.5',
  formGroup: 'flex flex-col gap-1.5',
  formLabel: 'text-[11px] font-medium tracking-wide uppercase text-ink-tertiary',
  formInput:
    'h-[42px] px-3.5 border border-line rounded-lg bg-bg-elevated text-ink text-sm outline-none w-full transition-all placeholder:text-ink-muted focus:border-mint focus:shadow-[0_0_0_3px_var(--mint-dim)]',
  formTextarea:
    'min-h-[100px] p-3.5 border border-line rounded-lg bg-bg-elevated text-ink text-sm outline-none w-full resize-y transition-all placeholder:text-ink-muted focus:border-mint focus:shadow-[0_0_0_3px_var(--mint-dim)]',
  formSelect:
    'h-[42px] px-3.5 border border-line rounded-lg bg-bg-elevated text-ink text-sm outline-none w-full transition-all focus:border-mint focus:shadow-[0_0_0_3px_var(--mint-dim)]',
  formHint: 'text-xs text-ink-tertiary mt-1',
  formHintSuccess: 'text-[13px] text-mint m-0',
  disabledInput: 'opacity-55 cursor-not-allowed',

  // Tables
  tableWrap: 'w-full overflow-x-auto rounded-xl',
  table: 'w-full border-collapse text-sm',
  th: 'text-left px-3.5 py-3 text-[10px] font-semibold tracking-wider uppercase text-[#777] bg-white/[0.03] border-b border-line',
  td: 'px-3.5 py-3.5 text-[#e0e0e0] border-b border-line-dim align-middle',
  trHover: 'hover:bg-white/[0.035]',
  textMuted: 'text-[#888]',
  textRight: 'text-right',

  // Tabs + pagination
  tabs: 'flex gap-1 bg-bg-hover border border-line rounded-full p-0.5 w-fit',
  tab: 'appearance-none border-0 bg-transparent text-ink-tertiary text-[11px] font-semibold tracking-wide uppercase px-4 py-2 rounded-full cursor-pointer transition-all',
  tabActive: 'bg-ink text-[var(--bg)]',
  pagination: 'flex items-center justify-center gap-3 mt-5 pt-4 border-t border-line',
  pageBtn:
    'inline-flex items-center justify-center min-w-9 h-9 px-3 border border-line rounded-lg bg-white/[0.03] text-[#ddd] cursor-pointer transition-all hover:border-white/30 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed',
  pageInfo: 'text-xs text-[#888]',

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
    'fixed bottom-6 right-6 z-[1300] flex items-center gap-2.5 px-4 py-3 rounded-xl border border-white/12 bg-[#0c0c0c]/95 backdrop-blur-xl text-white shadow-[0_16px_48px_rgba(0,0,0,0.55)]',
  toastSuccess: 'border-white/25',
  toastIcon: 'text-white font-extrabold',
  toastMessage: 'text-[13px] text-[#e8e8e8]',
  emptyState: 'text-[#888] text-center py-8 px-4 text-[13px]',

  // Editor
  editorShell: 'flex gap-6 items-start max-w-[1280px] mx-auto my-5 mb-10 px-5 w-full max-md:flex-col',
  editorCard: 'flex-1 min-w-0',
  editorToolbar: 'flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-line',
  editorToolBtn:
    'inline-flex items-center justify-center min-w-9 h-9 px-2 rounded-lg border border-line bg-transparent text-ink text-xs font-semibold cursor-pointer transition-all hover:bg-bg-hover hover:border-line-strong',
  editor:
    'min-h-[420px] w-full rounded-lg border border-line bg-bg-elevated text-ink p-4 text-base leading-relaxed outline-none focus:border-mint focus:shadow-[0_0_0_3px_var(--mint-dim)]',
  editorSidebar: 'w-[300px] shrink-0 sticky top-[72px] max-md:w-full max-md:static',
  editorSidebarHeader: 'font-semibold text-sm uppercase tracking-wide text-ink-secondary',
  editorSidebarContent: 'space-y-4',

  // Dashboard widgets
  barsContainer:
    'flex items-end justify-between gap-3 h-[220px] px-2 pt-4 pb-2 mt-2 border-t border-line',
  barItem: 'flex-1 flex flex-col items-center gap-2.5 min-w-0 h-full',
  barWrapper:
    'flex-1 w-full max-w-12 flex items-end justify-center bg-black/40 border border-line rounded-t-lg overflow-hidden relative',
  barFill:
    'w-full min-h-[12%] bg-gradient-to-b from-white to-white/40 rounded-t flex items-start justify-center pt-1.5 shadow-[0_0_16px_rgba(255,255,255,0.2)] transition-all',
  barValue: 'text-[11px] font-bold text-black leading-none',
  barLabel: 'text-[11px] font-semibold tracking-wide uppercase text-[#ccc] whitespace-nowrap',
  trendList: 'flex flex-col gap-2.5 max-h-[280px] overflow-y-auto',
  trendItem: 'p-3 bg-black/40 border border-line rounded-lg transition-colors hover:border-white/20',
  trendHeader: 'flex items-center justify-between gap-2.5 mb-1.5',
  trendPost: 'text-xs font-semibold text-white truncate min-w-0',
  trendLikes: 'text-[11px] font-semibold text-white whitespace-nowrap shrink-0',
  trendPreview: 'm-0 text-[13px] text-[#aaa] leading-snug',
  memberList: 'flex flex-col gap-2',
  memberItem:
    'flex items-center justify-between gap-3 px-3.5 py-3 bg-black/40 border border-line rounded-lg',
  memberName: 'font-semibold text-white block',
  memberRole: 'text-[11px] text-[#888] uppercase tracking-wide',
  memberCount: 'text-xl font-bold text-white mr-1.5',
  memberUnit: 'text-[11px] text-[#777] uppercase tracking-wide',

  // Media upload
  mediaGrid: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3',
  uploadArea:
    'border border-dashed border-line rounded-xl p-8 text-center bg-black/40 hover:border-white/30 hover:bg-white/[0.03] transition-colors cursor-pointer',
  uploadIcon: 'text-3xl text-white mb-2',
  uploadText: 'text-sm text-ink-secondary',

  // Posts list bits
  postCell: 'flex items-center gap-3 min-w-0',
  postThumb: 'w-[52px] h-10 rounded-lg overflow-hidden bg-white/[0.06] shrink-0',
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
