import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        /* Page & surfaces — CSS var mirrors (P1A canonical) */
        page:     'var(--color-page)',
        sidebar:  'var(--color-sidebar)',
        card:     'var(--color-card)',
        elevated: 'var(--color-elevated)',
        overlay:  'var(--color-overlay)',

        /* Borders */
        border: {
          subtle:  'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong:  'var(--border-strong)',
          accent:  'var(--border-accent)',
          success: 'var(--border-success)',
          warning: 'var(--border-warning)',
          danger:  'var(--border-danger)',
        },

        /* Text */
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
          disabled:  'var(--text-disabled)',
          inverse:   'var(--text-inverse)',
        },

        /* Primary accent */
        primary: {
          DEFAULT: 'var(--primary-base)',
          text:    'var(--primary-text)',
          hover:   'var(--primary-hover)',
          soft:    'var(--primary-soft-bg)',
        },

        /* Status — semantic roles via canonical accents */
        success: {
          DEFAULT: 'var(--text-success)',
          text:    'var(--text-success)',
          soft:    'var(--badge-success-bg)',
        },
        warning: {
          DEFAULT: 'var(--text-warning)',
          text:    'var(--text-warning)',
          soft:    'var(--badge-warning-bg)',
        },
        danger: {
          DEFAULT: 'var(--text-danger)',
          text:    'var(--text-danger)',
          soft:    'var(--badge-danger-bg)',
        },
      },

      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
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
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },

      boxShadow: {
        card:   'var(--shadow-card)',
        modal:  'var(--shadow-modal)',
        focus:  'var(--shadow-focus)',
      },

      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '200ms',
      },

      height: {
        'row-compact':     'var(--table-row-compact)',
        'row-comfortable': 'var(--table-row-comfortable)',
        'input-admin':     'var(--form-input-height-admin)',
        'input-client':    'var(--form-input-height-client)',
        'topbar':          'var(--topbar-height)',
      },

      width:   { sidebar: 'var(--sidebar-width)', 'sidebar-sm': 'var(--sidebar-collapsed)' },
      maxWidth: { client: 'var(--content-max-client)' },

      zIndex: {
        modal: '300',
      },

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

        /* ── Cards (panelCSS surfaces via CSS vars) ── */
        '.card': {
          background:   'var(--ds-panel-gradient)',
          border:       '1px solid var(--ds-border)',
          borderRadius: 'var(--ds-radius-lg)',
          boxShadow:    'var(--ds-shadow-flat)',
          padding:      'var(--ds-card-padding-admin)',
        },
        '.card-elevated': {
          background:   'var(--ds-panel-gradient)',
          border:       '1px solid var(--ds-border)',
          borderRadius: 'var(--ds-radius-lg)',
          boxShadow:    'var(--ds-shadow-raised)',
          padding:      'var(--ds-card-padding-admin)',
        },
        '.card-client': {
          background:   'var(--ds-panel-gradient)',
          border:       '1px solid var(--ds-border)',
          borderRadius: 'var(--ds-radius-lg)',
          boxShadow:    'var(--ds-shadow-raised)',
          padding:      'var(--ds-card-padding-client)',
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

        /* ── Status badges (ds-badge-* avoids legacy globals.css .badge-* collision) ── */
        '.ds-badge': {
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
        '.ds-badge-primary': {
          background:  'var(--badge-primary-bg)',
          borderColor: 'rgba(124,143,202,0.26)',
          color:       'var(--text-primary-role)',
        },
        '.ds-badge-success': {
          background:  'var(--badge-success-bg)',
          borderColor: 'rgba(111,169,137,0.26)',
          color:       'var(--text-success)',
        },
        '.ds-badge-warning': {
          background:  'var(--badge-warning-bg)',
          borderColor: 'rgba(190,143,104,0.30)',
          color:       'var(--text-warning)',
        },
        '.ds-badge-danger': {
          background:  'var(--badge-danger-bg)',
          borderColor: 'rgba(185,111,111,0.30)',
          color:       'var(--text-danger)',
        },
        '.ds-badge-muted': {
          background:  'rgba(71,85,105,0.14)',
          borderColor: 'rgba(71,85,105,0.28)',
          color:       'var(--text-muted)',
        },
        '.ds-badge-dot': {
          width:        '4px',
          height:       '4px',
          borderRadius: '50%',
          background:   'currentColor',
          flexShrink:   '0',
        },
        /* Spec §4.2 — status pills are rounded-full; colors via inline CSS vars */
        '.ds-status-badge': {
          borderRadius: '9999px',
          fontSize:     '10px',
          fontWeight:   '500',
          padding:      '3px 8px',
          lineHeight:   '1',
          gap:          '5px',
        },
        '.ds-status-dot': {
          display:      'inline-block',
          width:        '8px',
          height:       '8px',
          borderRadius: '9999px',
          flexShrink:   '0',
          verticalAlign: 'middle',
        },
      });
    },
  ],
};

export default config;
