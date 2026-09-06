/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './types/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
		zIndex: {
			overlay: 'var(--z-overlay)',
			dialog: 'var(--z-dialog)',
			popover: 'var(--z-popover)',
			toast: 'var(--z-toast)',
		},
		fontFamily: {
			sans: [
				'-apple-system',
				'BlinkMacSystemFont',
				'"Segoe UI"',
				'Roboto',
				'"Helvetica Neue"',
				'Arial',
				'sans-serif'
			],
			serif: [
				'-apple-system',
				'BlinkMacSystemFont',
				'"Segoe UI"',
				'Roboto',
				'"Helvetica Neue"',
				'Arial',
				'sans-serif'
  			]
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
			primary: {
				DEFAULT: 'hsl(var(--primary))',
				hover: 'hsl(var(--primary-hover))',
				soft: 'hsl(var(--primary-soft))',
				border: 'hsl(var(--primary-border))',
				foreground: 'hsl(var(--primary-foreground))'
			},
			'border-strong': 'hsl(var(--border-strong))',
			disabled: 'hsl(var(--disabled))',
			favorite: {
				DEFAULT: 'hsl(var(--favorite))',
				hover: 'hsl(var(--favorite-hover))'
			},
			rating: 'hsl(var(--rating))',
			verified: 'hsl(var(--verified))',
			presence: 'hsl(var(--presence))',
			info: 'hsl(var(--info))',
			warning: 'hsl(var(--warning))',
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			}
  		},
		borderRadius: {
			control: '10px',
			input: '12px',
			tile: '16.8px',
			card: '21.6px',
			nav: '26px',
			lg: '12px',
			md: 'var(--radius)',
			sm: '7.2px',
			xl: '16.8px',
			'2xl': '21.6px'
		},
		boxShadow: {
			floating: '0 8px 24px rgb(38 38 38 / 12%)',
			'primary-floating': '0 4px 12px rgb(23 23 23 / 12%)',
			'bottom-nav': '0 4px 25px rgb(0 0 0 / 8%)'
		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
		animation: {
			'accordion-down': 'accordion-down 0.2s ease-out',
			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
