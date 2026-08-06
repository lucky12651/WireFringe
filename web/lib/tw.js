/**
 * Reusable Tailwind class bundles (GridWork pattern: styles live in JS, not CSS files).
 * Import and use as className={tw.adminCard} — keeps globals.css tiny.
 */
export const tw = {
  // Brand logo
  logoLink: 'inline-flex items-center no-underline text-inherit leading-none',
  logo: 'inline-block font-black whitespace-nowrap text-white leading-none tracking-[-0.065em] font-heading',
  logoF:
    'text-mint italic font-extrabold inline-block [transform:skewX(-6deg)] [text-shadow:0_0_18px_rgba(60,255,208,0.25)]',
  logoSm: 'text-lg',
  logoMd: 'text-[26px]',
  logoLg: 'text-[32px]',
  logoXl: 'text-[44px] [text-shadow:0_0_40px_rgba(60,255,208,0.12)]',

  // Buttons
  btnAccent:
    'inline-flex items-center justify-center px-4 py-2.5 rounded-sm border-0 bg-mint text-black text-xs font-bold font-mono uppercase tracking-wider cursor-pointer no-underline transition-all duration-200 shadow-[0_4px_16px_rgba(60,255,208,0.2)] hover:bg-mint-hover hover:-translate-y-px',
  pillBtn:
    'inline-flex items-center gap-2 px-3.5 py-2 rounded-sm border border-line bg-bg-elevated text-[#ddd] text-xs font-semibold font-mono uppercase tracking-wide cursor-pointer no-underline transition-all duration-200 hover:bg-bg-hover hover:border-mint hover:text-mint hover:-translate-y-px',
  heroCta:
    'inline-flex items-center justify-center px-[18px] py-2.5 rounded-sm border-0 bg-mint text-black text-xs font-bold font-mono uppercase tracking-wider cursor-pointer no-underline transition-all duration-200 shadow-[0_4px_16px_rgba(60,255,208,0.2)] hover:bg-mint-hover hover:-translate-y-px',
  primaryBtn:
    'inline-flex items-center justify-center gap-2 h-[42px] px-[18px] border-0 rounded-sm bg-mint text-black font-mono text-xs font-bold tracking-[0.08em] uppercase cursor-pointer no-underline transition-all hover:bg-[#2ee6b8] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(60,255,208,0.25)]',
  secondaryBtn:
    'inline-flex items-center justify-center gap-2 h-[42px] px-4 border border-line rounded-sm bg-bg-elevated text-[#ddd] font-mono text-[11px] font-bold tracking-wide uppercase cursor-pointer no-underline transition-all hover:text-mint hover:border-mint hover:bg-mint/[0.06] disabled:opacity-50 disabled:cursor-not-allowed',
  iconBtn:
    'inline-flex items-center justify-center w-9 h-9 rounded-md border border-line bg-bg-elevated text-[#aaa] cursor-pointer no-underline transition-all hover:text-mint hover:border-mint hover:bg-mint/[0.08]',
  iconBtnDanger:
    'inline-flex items-center justify-center w-9 h-9 rounded-md border border-line bg-bg-elevated text-[#aaa] cursor-pointer transition-all hover:text-[#ff6b6b] hover:border-[#ff6b6b] hover:bg-red-500/10',
  iconBtnApprove:
    'inline-flex items-center justify-center w-9 h-9 rounded-md border border-mint/30 bg-mint/[0.08] text-mint cursor-pointer transition-all hover:bg-mint/20 hover:border-mint',

  // Layout shells
  pageShell: 'w-full min-h-screen bg-[#0a0a0a] text-white m-0 mx-auto',
  pageShellAdmin: 'w-full min-h-screen bg-[#0a0a0a] text-white m-0 p-0 max-w-none',
  adminShell: 'flex min-h-screen w-full bg-[#0a0a0a] m-0 p-0 max-md:flex-col max-md:pb-[72px]',
  adminContent: 'flex-1 py-7 px-8 pb-12 w-full min-w-0 bg-[#0a0a0a] m-0 max-w-none max-md:px-4 max-md:py-5',
  adminContentInner: 'max-w-[1280px] mx-auto animate-fade-up',
  adminView: 'flex flex-col gap-5 animate-fade-up',
  adminGrid: 'grid grid-cols-1 min-[901px]:grid-cols-[1fr_1.4fr] gap-4 items-start',
  adminGrid2: 'grid grid-cols-1 min-[901px]:grid-cols-2 gap-4',
  adminTopbar: 'flex items-center justify-between gap-4 px-6 py-4 border-b border-line bg-black/80',
  adminMe: 'text-sm text-ink-secondary',
  adminTitleRow: 'flex flex-col gap-2 mb-5',
  accentLine: 'h-0.5 w-12 bg-mint rounded-sm',

  // Cards
  card: 'rounded-lg border border-line bg-bg-elevated p-[22px] shadow-[0_8px_28px_rgba(0,0,0,0.25)] transition-[border-color,box-shadow] duration-200 hover:border-mint/20 min-w-0',
  cardFull: 'rounded-lg border border-line bg-bg-elevated p-[22px] shadow-[0_8px_28px_rgba(0,0,0,0.25)] w-full min-w-0',
  cardTitle:
    'text-[15px] font-extrabold text-white m-0 mb-4 tracking-tight pb-3 border-b border-[#222]',
  cardDesc: 'text-[13px] text-[#888] -mt-2 mb-4 leading-snug',
  sideCard:
    'rounded-lg border border-line bg-bg-elevated p-5 min-w-0 shadow-[0_8px_28px_rgba(0,0,0,0.25)] transition-colors hover:border-mint/20',
  sideHeader: 'flex items-baseline justify-between gap-3 mb-4 pb-3 border-b border-line',
  titleCount:
    'font-mono text-[11px] font-bold tracking-wider uppercase text-mint bg-mint/[0.08] border border-mint/20 px-3 py-1.5 rounded-full',
  titleGroup: 'flex flex-col gap-3 min-w-0',
  headerActions: 'flex items-center gap-2.5 flex-wrap',

  // Forms
  form: 'flex flex-col gap-3.5',
  formGroup: 'flex flex-col gap-1.5',
  formLabel: 'font-mono text-[11px] font-semibold tracking-wide uppercase text-[#888]',
  formInput:
    'h-[42px] px-3 border border-line rounded-sm bg-[#0a0a0a] text-white text-sm outline-none w-full transition-colors focus:border-mint focus:shadow-[0_0_0_3px_rgba(60,255,208,0.12)]',
  formTextarea:
    'min-h-[100px] p-3 border border-line rounded-sm bg-[#0a0a0a] text-white text-sm outline-none w-full resize-y transition-colors focus:border-mint focus:shadow-[0_0_0_3px_rgba(60,255,208,0.12)]',
  formSelect:
    'h-[42px] px-3 border border-line rounded-sm bg-[#0a0a0a] text-white text-sm outline-none w-full transition-colors focus:border-mint focus:shadow-[0_0_0_3px_rgba(60,255,208,0.12)]',
  formHint: 'text-xs text-[#666] mt-1',
  formHintSuccess: 'text-[13px] text-mint m-0',
  disabledInput: 'opacity-55 cursor-not-allowed',

  // Tables
  tableWrap: 'w-full overflow-x-auto rounded-md',
  table: 'w-full border-collapse text-sm',
  th: 'text-left px-3.5 py-3 font-mono text-[10px] font-bold tracking-wider uppercase text-[#777] bg-[#101010] border-b border-line',
  td: 'px-3.5 py-3.5 text-[#e0e0e0] border-b border-[#1f1f1f] align-middle',
  trHover: 'hover:bg-mint/[0.03]',
  textMuted: 'text-[#888]',
  textRight: 'text-right',

  // Tabs + pagination
  tabs: 'flex gap-1 bg-[#1a1a1a] rounded-full p-0.5 w-fit',
  tab: 'appearance-none border-0 bg-transparent text-[#888] font-mono text-[11px] font-bold tracking-wide uppercase px-4 py-2 rounded-full cursor-pointer transition-all',
  tabActive: 'bg-mint text-black',
  pagination: 'flex items-center justify-center gap-3 mt-5 pt-4 border-t border-[#222]',
  pageBtn:
    'inline-flex items-center justify-center min-w-9 h-9 px-3 border border-line rounded-sm bg-bg-elevated text-[#ddd] cursor-pointer transition-all hover:border-mint hover:text-mint disabled:opacity-40 disabled:cursor-not-allowed',
  pageInfo: 'text-xs text-[#888] font-mono',

  // Modal + toast
  modalOverlay:
    'fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md',
  modalContent:
    'w-[min(520px,100%)] max-h-[min(88vh,760px)] overflow-auto bg-[#121212] border border-line text-white rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.65)]',
  modalHeader: 'flex items-center justify-between gap-3 px-5 pt-[18px]',
  modalTitle: 'm-0 text-[17px] font-extrabold tracking-tight text-white',
  modalBody: 'px-5 pt-3.5 pb-1.5 text-[#c8c8c8] leading-relaxed text-sm',
  modalWarning: 'text-[#ff9b9b] text-xs font-mono mt-2.5',
  modalActions:
    'flex justify-end items-center flex-wrap gap-2.5 px-5 py-4 border-t border-[#222] mt-2',
  toast:
    'fixed bottom-6 right-6 z-[1300] flex items-center gap-2.5 px-4 py-3 rounded-lg border border-line bg-bg-elevated text-white shadow-[0_12px_32px_rgba(0,0,0,0.45)]',
  toastSuccess: 'border-mint/35',
  toastIcon: 'text-mint font-extrabold',
  toastMessage: 'text-[13px] text-[#e8e8e8]',
  emptyState: 'text-[#888] text-center py-8 px-4 text-[13px]',

  // Editor
  editorShell: 'flex gap-4 items-start max-w-[1280px] mx-auto my-5 mb-10 px-5 w-full max-md:flex-col',
  editorCard: 'flex-1 min-w-0',
  editorToolbar: 'flex flex-wrap gap-2 mb-4 p-2 border border-line rounded-md bg-bg-secondary',
  editor:
    'min-h-[420px] w-full rounded-md border border-line bg-[#0a0a0a] text-white p-4 text-base leading-relaxed outline-none focus:border-mint',
  editorSidebar: 'w-[300px] shrink-0 sticky top-4 max-md:w-full max-md:static',
  editorSidebarHeader: 'font-bold text-sm uppercase tracking-wide text-ink-secondary mb-3',
  editorSidebarContent: 'space-y-4',

  // Dashboard widgets
  barsContainer:
    'flex items-end justify-between gap-3 h-[220px] px-2 pt-4 pb-2 mt-2 border-t border-[#222]',
  barItem: 'flex-1 flex flex-col items-center gap-2.5 min-w-0 h-full',
  barWrapper:
    'flex-1 w-full max-w-12 flex items-end justify-center bg-[#0a0a0a] border border-[#222] rounded-t-md overflow-hidden relative',
  barFill:
    'w-full min-h-[12%] bg-gradient-to-b from-mint to-[#1a9e80] rounded-t flex items-start justify-center pt-1.5 shadow-[0_0_16px_rgba(60,255,208,0.25)] transition-all',
  barValue: 'font-mono text-[11px] font-bold text-black leading-none',
  barLabel: 'font-mono text-[11px] font-bold tracking-wide uppercase text-[#ccc] whitespace-nowrap',
  trendList: 'flex flex-col gap-2.5 max-h-[280px] overflow-y-auto',
  trendItem: 'p-3 bg-[#101010] border border-[#222] rounded-md transition-colors hover:border-mint/30',
  trendHeader: 'flex items-center justify-between gap-2.5 mb-1.5',
  trendPost: 'text-xs font-bold text-white truncate min-w-0',
  trendLikes: 'font-mono text-[11px] font-bold text-mint whitespace-nowrap shrink-0',
  trendPreview: 'm-0 text-[13px] text-[#aaa] leading-snug',
  memberList: 'flex flex-col gap-2',
  memberItem:
    'flex items-center justify-between gap-3 px-3.5 py-3 bg-[#101010] border border-[#222] rounded-md',
  memberName: 'font-bold text-white block',
  memberRole: 'text-[11px] text-[#888] font-mono uppercase tracking-wide',
  memberCount: 'text-xl font-extrabold text-mint mr-1.5',
  memberUnit: 'text-[11px] text-[#777] uppercase tracking-wide',

  // Media upload
  mediaGrid: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3',
  uploadArea:
    'border border-dashed border-line rounded-lg p-8 text-center bg-[#0a0a0a] hover:border-mint/40 transition-colors cursor-pointer',
  uploadIcon: 'text-3xl text-mint mb-2',
  uploadText: 'text-sm text-ink-secondary',

  // Posts list bits
  postCell: 'flex items-center gap-3 min-w-0',
  postThumb: 'w-[52px] h-10 rounded overflow-hidden bg-[#1a1a1a] shrink-0',
  actionGroup: 'flex gap-2 justify-end',
  cardHeader: 'flex items-center justify-between mb-3 pb-3 border-b border-[#222]',
  cardSubtitle: 'block text-xs text-[#777] mt-1',
  statusBadge:
    'inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wide',
  spin: 'animate-spin',
  mt32: 'mt-8',
  fullWidth: 'w-full',
  dot: 'w-2 h-2 rounded-full inline-block bg-mint shadow-[0_0_8px_rgba(60,255,208,0.5)]',
  hl: 'bg-bg-highlight px-[0.1em] [box-decoration-break:clone]',
  metaAuthor: 'font-mono uppercase text-mint font-bold text-meta tracking-wider',
};
