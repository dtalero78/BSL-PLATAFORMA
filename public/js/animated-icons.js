/**
 * Animated Icons - Inspirado en itshover/itshover
 * Sistema de iconos SVG animados con vanilla JavaScript
 * Sin dependencias de React
 */

const AnimatedIcons = {
    // Configuración de animaciones
    createIcon(svg, animation) {
        const wrapper = document.createElement('span');
        wrapper.innerHTML = svg;
        wrapper.style.display = 'inline-flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';

        const svgElement = wrapper.querySelector('svg');
        if (!svgElement) return wrapper;

        // Aplicar animación al hacer hover
        wrapper.addEventListener('mouseenter', () => {
            animation.start(svgElement);
        });

        wrapper.addEventListener('mouseleave', () => {
            animation.stop(svgElement);
        });

        return wrapper;
    },

    // Animaciones reutilizables
    animations: {
        scaleRotate: {
            start: (svg) => {
                const group = svg.querySelector('.anim-group');
                if (group) {
                    group.style.transition = 'transform 0.5s ease-in-out';
                    group.style.transformOrigin = 'center';
                    group.style.transform = 'scale(1.1) rotate(5deg)';
                }
            },
            stop: (svg) => {
                const group = svg.querySelector('.anim-group');
                if (group) {
                    group.style.transform = 'scale(1) rotate(0deg)';
                }
            }
        },
        bounce: {
            start: (svg) => {
                const group = svg.querySelector('.anim-group');
                if (group) {
                    group.style.transition = 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                    group.style.transformOrigin = 'center';
                    group.style.transform = 'translateY(-3px) scale(1.05)';
                }
            },
            stop: (svg) => {
                const group = svg.querySelector('.anim-group');
                if (group) {
                    group.style.transform = 'translateY(0) scale(1)';
                }
            }
        },
        pulse: {
            start: (svg) => {
                svg.style.animation = 'icon-pulse 0.6s ease-in-out';
            },
            stop: (svg) => {
                svg.style.animation = '';
            }
        }
    },

    // Íconos individuales
    fileText: (size = 20, color = 'currentColor') => {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <g class="anim-group">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </g>
            </svg>
        `;
        return AnimatedIcons.createIcon(svg, AnimatedIcons.animations.bounce);
    },

    clipboard: (size = 20, color = 'currentColor') => {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <g class="anim-group">
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <line x1="9" y1="12" x2="15" y2="12"></line>
                    <line x1="9" y1="16" x2="15" y2="16"></line>
                </g>
            </svg>
        `;
        return AnimatedIcons.createIcon(svg, AnimatedIcons.animations.scaleRotate);
    },

    plusCircle: (size = 20, color = 'currentColor') => {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <g class="anim-group">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                </g>
            </svg>
        `;
        return AnimatedIcons.createIcon(svg, AnimatedIcons.animations.pulse);
    },

    upload: (size = 20, color = 'currentColor') => {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <g class="anim-group">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </g>
            </svg>
        `;
        return AnimatedIcons.createIcon(svg, AnimatedIcons.animations.bounce);
    },

    calendar: (size = 20, color = 'currentColor') => {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <g class="anim-group">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </g>
            </svg>
        `;
        return AnimatedIcons.createIcon(svg, AnimatedIcons.animations.scaleRotate);
    },

    users: (size = 20, color = 'currentColor') => {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <g class="anim-group">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </g>
            </svg>
        `;
        return AnimatedIcons.createIcon(svg, AnimatedIcons.animations.bounce);
    },

    eye: (size = 20, color = 'currentColor') => {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <g class="anim-group">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </g>
            </svg>
        `;
        return AnimatedIcons.createIcon(svg, AnimatedIcons.animations.pulse);
    },

    clock: (size = 20, color = 'currentColor') => {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <g class="anim-group">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </g>
            </svg>
        `;
        return AnimatedIcons.createIcon(svg, AnimatedIcons.animations.scaleRotate);
    },

    activity: (size = 20, color = 'currentColor') => {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <g class="anim-group">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </g>
            </svg>
        `;
        return AnimatedIcons.createIcon(svg, AnimatedIcons.animations.pulse);
    },

    briefcase: (size = 20, color = 'currentColor') => {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <g class="anim-group">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </g>
            </svg>
        `;
        return AnimatedIcons.createIcon(svg, AnimatedIcons.animations.bounce);
    },

    grid: (size = 20, color = 'currentColor') => {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <g class="anim-group">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                </g>
            </svg>
        `;
        return AnimatedIcons.createIcon(svg, AnimatedIcons.animations.scaleRotate);
    },

    dollarSign: (size = 20, color = 'currentColor') => {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <g class="anim-group">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </g>
            </svg>
        `;
        return AnimatedIcons.createIcon(svg, AnimatedIcons.animations.pulse);
    },

    chevronLeft: (size = 20, color = 'currentColor') => {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <g class="anim-group">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </g>
            </svg>
        `;
        return AnimatedIcons.createIcon(svg, AnimatedIcons.animations.scaleRotate);
    }
};

// Agregar CSS para las animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes icon-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15); }
    }

    .anim-group {
        transition: transform 0.3s ease;
        transform-origin: center;
    }
`;
document.head.appendChild(style);

// Función helper para reemplazar íconos en el DOM
function replaceFeatherIcons() {
    document.querySelectorAll('[data-feather]').forEach(element => {
        const iconName = element.getAttribute('data-feather');
        const size = element.getAttribute('data-size') || 20;
        const color = element.getAttribute('data-color') || 'currentColor';

        // Mapeo de nombres de Feather a nuestros íconos
        const iconMap = {
            'file-text': 'fileText',
            'clipboard-list': 'clipboard',
            'plus-circle': 'plusCircle',
            'upload': 'upload',
            'calendar': 'calendar',
            'users': 'users',
            'eye': 'eye',
            'clock': 'clock',
            'activity': 'activity',
            'briefcase': 'briefcase',
            'grid': 'grid',
            'dollar-sign': 'dollarSign',
            'chevron-left': 'chevronLeft'
        };

        const animatedIconName = iconMap[iconName];
        if (animatedIconName && AnimatedIcons[animatedIconName]) {
            const newIcon = AnimatedIcons[animatedIconName](size, color);
            element.replaceWith(newIcon);
        }
    });
}

// Exportar para uso global
window.AnimatedIcons = AnimatedIcons;
window.replaceFeatherIcons = replaceFeatherIcons;
