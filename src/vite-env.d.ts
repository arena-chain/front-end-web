/// <reference types="vite/client" />
import type * as React from 'react';

interface ImportMetaEnv {
    /** Optional UI override if backend `/config` has not been redeployed yet */
    readonly VITE_GAME_TOKEN_DISPLAY_SYMBOL?: string;
    readonly VITE_GAME_TOKEN_DISPLAY_NAME?: string;
}

type ModelViewerProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
    src?: string;
    alt?: string;
    crossOrigin?: 'anonymous' | 'use-credentials';
    poster?: string;
    'camera-controls'?: boolean;
    'auto-rotate'?: boolean;
    'rotation-per-second'?: string;
    reveal?: string;
    'interaction-prompt'?: string;
    'camera-orbit'?: string;
    'min-camera-orbit'?: string;
    'max-camera-orbit'?: string;
    'min-field-of-view'?: string;
    'max-field-of-view'?: string;
    'zoom-sensitivity'?: string;
    'touch-action'?: string;
    'interpolation-decay'?: string;
    exposure?: string;
    'shadow-intensity'?: string;
    'shadow-softness'?: string;
    'environment-image'?: string;
    'tone-mapping'?: string;
};

declare global {
    namespace React {
        namespace JSX {
            interface IntrinsicElements {
                'model-viewer': ModelViewerProps;
            }
        }
    }
}

declare module '*.glb' {
    const src: string;
    export default src;
}
