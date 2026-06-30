import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Page & surfaces */
        page:     '#05060B',
        sidebar:  '#0C0E1C',
        card:     '#111320',
        elevated: '#161B34',
        overlay:  '#04050A',

        /* Borders */
        border: {
          subtle:  'rgba(41,52,71,0.45)',
          DEFAULT: 'rgba(51,65,85,0.50)',
          strong:  'rgba(71,85,105,0.60)',
          accent:  'rgba(124,143,202,0.38)',
          success: 'rgba(111,169,137,0.30)',
          warning: 'rgba(190,143,104,0.32)',
          danger:  'rgba(185,111,111,0.32)',
        },

        /* Text */
        text: {
          primary:   '#F1F5F9',
          secondary: 'rgba(148,163,184,0.88)',
          muted:     'rgba(100,116,139,0.80)',
          disabled:  'rgba(71,85,105,0.60)',
          inverse:   '#060710',
        },

        /* Primary accent */
        primary: {
          DEFAULT: '#5B6B9E',
          text:    '#7C8FCA',
          hover:   '#8FA0D4',
          soft:    'rgba(124,143,202,0.12)',
        },

        /* Status — WCAG AA corrected */
        success: {
          DEFAULT: '#4B8B6F',
          text:    '#6FA989',
          soft:    'rgba(111,169,137,0.12)',
        },
        warning: {
          DEFAULT: '#8B7055',
          text:    '#BE8F68',
          soft:    'rgba(190,143,104,0.13)',
        },
        danger: {
          DEFAULT: '#8B5555',
          text:    '#B96F6F',
          soft:    'rgba(185,111,111,0.13)',
        },
      },

      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        'caption':   ['11px', { lineHeight: '14px', letterSpacing: '0.01em',   fontWeight: '600' }],
        'body-xs':   ['12px', { lineHeight: '16px', letterSpacing: '0',        fontWeight: '400' }],
        'body-sm':   ['13px', { lineHeight: '18px', letterSpacing: '0',        fontWeight: '400' }],
        'body-md':   ['14px', { lineHeight: '20px', letterSpacing: '-0.005em', fontWeight: '400' }],
        'body-lg':   ['15px', { lineHeight: '22px', letterSpacing: '-0.01em',  fontWeight: '400' }],
        'title-sm':  ['16px', { lineHeight: '22px', letterSpacing: '-0.01em',  fontWeight: '600' }],
        'title-md':  ['18px', { lineHeight: '26px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'title-lg':  ['20px', { lineHeight: '28px', letterSpacing: '-0.02em',  fontWeight: '600' }],
        'heading-sm':['22px', { lineHeight: '30px', letterSpacing: '-0.025em', fontWeight: '600' }],
        'heading-md':['24px', { lineHeight: '32px', letterSpacing: '-0.03em',  fontWeight: '600' }],
      },

      fontWeight: {
        regular:  '400',
        medium:   '500',
        semibold: '600',
      },

      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
      },

      borderRadius: {
        sm:   '4px',
        md:   '6px',
        lg:   '8px',
        xl:   '12px',
        full: '9999px',
      },

      boxShadow: {
        card:   '0 1px 3px rgba(0,0,0,.45), 0 1px 2px rgba(0,0,0,.35)',
        modal:  '0 8px 32px rgba(0,0,0,.60), 0 2px 8px rgba(0,0,0,.45)',
        focus:  '0 0 0 3px rgba(124,143,202,0.30)',
      },

      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '300ms',
      },

      height: {
        'row-compact':     '44px',
        'row-comfortable': '52px',
        'input-admin':     '36px',
        'input-client':    '44px',
        'topbar':          '52px',
      },

      width:   { sidebar: '240px', 'sidebar-sm': '64px' },
      maxWidth: { client: '960px' },

      /* Custom background gradients referenced via CSS vars */
      backgroundImage: {
        'page':    'var(--bg-page-gradient)',
        'sidebar': 'var(--surface-sidebar)',
        'topbar':  'var(--surface-topbar)',
        'card':    'var(--surface-card)',
        'elevated':'var(--surface-elevated)',
        'btn-primary':       'var(--primary-btn-gradient)',
        'btn-primary-hover': 'var(--primary-btn-hover)',
        'nav-active':        'var(--primary-nav-active)',
      },
    },
  },

  plugins: [
    function ({ addComponents }: any) {
      addComponents({
        /* ── Density wrappers ── */
        '[data-density="compact"]': {
          '--density-text':      '13px',
          '--density-row':       '44px',
          '--density-cell-px':   '12px',
          '--density-cell-py':   '9px',
          '--density-card-p':    '10px 12px',
          '--density-input-h':   '36px',
          '--density-gap':       '8px',
        },
        '[data-density="comfortable"]': {
          '--density-text':      '14px',
          '--density-row':       '52px',
          '--density-cell-px':   '16px',
          '--density-cell-py':   '13px',
          '--density-card-p':    '14px 16px',
          '--density-input-h':   '44px',
          '--density-gap':       '12px',
        },

        /* ── App shell ── */
        '.app-shell': {
          display:         'flex',
          minHeight:       '100vh',
          background:      'var(--bg-page-gradient)',
          color:           'var(--text-primary)',
          fontFamily:      'var(--font-sans)',
        },
        '.app-sidebar': {
          width:           '240px',
          flexShrink:      '0',
          background:      'var(--surface-sidebar)',
          borderRight:     '1px solid var(--border-subtle)',
          display:         'flex',
          flexDirection:   'column',
        },
        '.app-topbar': {
          height:          '52px',
          background:      'var(--surface-topbar)',
          borderBottom:    '1px solid var(--border-subtle)',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
          padding:         '0 24px',
        },
        '.app-content': {
          flex:     '1',
          minWidth: '0',
          padding:  '24px',
          overflowX: 'hidden',
        },

        /* ── Cards ── */
        '.card': {
          background:   'var(--surface-card)',
          border:       '1px solid var(--border-default)',
          borderRadius: '8px',
          padding:      '12px 14px',
        },
        '.card-elevated': {
          background:   'var(--surface-elevated)',
          border:       '1px solid var(--border-strong)',
          borderRadius: '8px',
          padding:      '12px 14px',
        },
        '.card-client': {
          background:   'var(--surface-card)',
          border:       '1px solid var(--border-default)',
          borderRadius: '12px',
          padding:      '16px 18px',
        },

        /* ── Section label ── */
        '.section-label': {
          fontSize:      '11px',
          fontWeight:    '600',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color:         'var(--text-muted)',
          marginBottom:  '8px',
          display:       'flex',
          alignItems:    'center',
          gap:           '10px',
        },
        '.section-label::after': {
          content:    '""',
          flex:       '1',
          height:     '1px',
          background: 'var(--border-subtle)',
        },

        /* ── Status badges ── */
        '.badge': {
          display:       'inline-flex',
          alignItems:    'center',
          gap:           '4px',
          padding:       '2px 7px 2px 5px',
          borderRadius:  '4px',
          fontSize:      '11px',
          fontWeight:    '600',
          border:        '1px solid',
          whiteSpace:    'nowrap',
        },
        '.badge-primary': {
          background:  'var(--badge-primary-bg)',
          borderColor: 'rgba(124,143,202,0.26)',
          color:       'var(--text-primary-role)',
        },
        '.badge-success': {
          background:  'var(--badge-success-bg)',
          borderColor: 'rgba(111,169,137,0.26)',
          color:       'var(--text-success)',
        },
        '.badge-warning': {
          background:  'var(--badge-warning-bg)',
          borderColor: 'rgba(190,143,104,0.30)',
          color:       'var(--text-warning)',
        },
        '.badge-danger': {
          background:  'var(--badge-danger-bg)',
          borderColor: 'rgba(185,111,111,0.30)',
          color:       'var(--text-danger)',
        },
        '.badge-muted': {
          background:  'rgba(71,85,105,0.14)',
          borderColor: 'rgba(71,85,105,0.28)',
          color:       'var(--text-muted)',
        },
        '.badge-dot': {
          width:        '4px',
          height:       '4px',
          borderRadius: '50%',
          background:   'currentColor',
          flexShrink:   '0',
        },
      });
    },
  ],
};

export default config;
