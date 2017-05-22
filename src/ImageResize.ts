import * as Quill from 'quill';
import { merge } from 'lodash';
import { DisplaySize } from './modules/DisplaySize';
import { Resize } from './modules/Resize';

const knownModules: {} = { DisplaySize, Resize };

interface IDefaultOptions {
    modules?: { [key: string]: any },
    overlayStyles?: {}, // CSSStyleDeclaration
    handleStyles?: any | {},
    displayStyles?: any | {},
    toolbarStyles?: any | {},
    toolbarButtonStyles?: any | {},
    toolbarButtonSvgStyles?: any | {}
}

const DefaultOptions: IDefaultOptions = {
    modules: {
        DisplaySize: DisplaySize,
        Resize: Resize
    },
    overlayStyles: {
        position: 'absolute',
        boxSizing: 'border-box',
        border: '1px dashed #444',
    },
    handleStyles: {
        position: 'absolute',
        height: '12px',
        width: '12px',
        backgroundColor: 'white',
        border: '1px solid #777',
        boxSizing: 'border-box',
        opacity: '0.80',
    },
    displayStyles: {
        position: 'absolute',
        font: '12px/1.0 Arial, Helvetica, sans-serif',
        padding: '4px 8px',
        textAlign: 'center',
        backgroundColor: 'white',
        color: '#333',
        border: '1px solid #777',
        boxSizing: 'border-box',
        opacity: '0.80',
        cursor: 'default',
    },
    toolbarStyles: {
        position: 'absolute',
        top: '-12px',
        right: '0',
        left: '0',
        height: '0',
        minWidth: '100px',
        font: '12px/1.0 Arial, Helvetica, sans-serif',
        textAlign: 'center',
        color: '#333',
        boxSizing: 'border-box',
        cursor: 'default',
    },
    toolbarButtonStyles: {
        display: 'inline-block',
        width: '24px',
        height: '24px',
        background: 'white',
        border: '1px solid #999',
        verticalAlign: 'middle',
    },
    toolbarButtonSvgStyles: {
        fill: '#444',
        stroke: '#444',
        strokeWidth: '2',
    }
}

export interface IOverlayOptions extends Quill.QuillOptionsStatic, IDefaultOptions {

}

export interface IQuillInstance extends Quill.Quill {
    root: HTMLElement,
    container: HTMLElement,

    editor: any, // Editor
    emitter: any, // Emitter
    history: any,// History
    keyboard: Quill.KeyboardStatic,
    options: {
        bounds: Quill.BoundsStatic,
        container: HTMLElement,
        modules: Object,
        placeholder: string,
        readonly: boolean,
        scrollingContainer: HTMLElement,
        strict: boolean,
        theme: (quill: IQuillInstance, options: IOverlayOptions) => void
    },
    scroll: any, // Scroll
    scrollingContainer: HTMLElement,
    selection: any // Selection,
    theme: any // e.g. SnowTheme
}


export class ImageResize {

    private _options: IOverlayOptions;
    private instance: IQuillInstance;
    private currentSelectedImage: EventTarget | Element;

    private currentOverlay: HTMLElement;

    private currentModules: Object;
    private modules: any[];

    constructor(quill: IQuillInstance, options: IOverlayOptions) {
        this.instance = quill;
        //quill
        console.log("quill", this.instance);
        console.log("options", options);
        console.log("THIS:_OPTIONS", this._options);
        this._options = merge({}, options, DefaultOptions, this.instance.options, );
        console.log("THIS:_OPTIONS", this._options);

        // Disable native image resize in firefox:
        document.execCommand('enableObjectResizing', false, 'false');

        this.instance.root.addEventListener('click', this.handleClick(), false);
        this.instance.root.parentElement.style.position = this.instance.root.parentElement.style.position || 'relative';

        this.modules = [];
    }

    private initModules() {
        this.destroyModules();
        console.log("MODULES", this._options.modules);
        if (this._options.modules)
            this.modules = this._options.modules.map(
                function (mclass) {
                    console.log("MCLASS", mclass);
                    return new (knownModules[mclass] || mclass)(this);
                }
            );

        this.modules.forEach(function (module) {
            module.onCreate();
        });
        this.onUpdate();
    }

    private destroyModules() {
        this.modules.forEach(function (module) {
            module.onDestroy();
        });
        this.modules = []
    }

    public handleClick(): (evt: Event) => void {
        var self = this;
        return function (event) {
            console.log("EVENT", event, "this", this);

            if (event.target && event.target['tagName'] && event.target['tagName'].toUpperCase() === 'IMG') {
                console.log('image clicked');
                if (self.currentSelectedImage == event.target)
                    return; // Focuse is already up and running
                else if (self.currentSelectedImage)
                    self.hideSelection();

                self.showSelection(<HTMLElement>event.target);
            }
            else if (self.currentSelectedImage)
                self.hideSelection();
        }
    }

    private hideSelection() {
        if (!this.currentSelectedImage)
            return;

        this.instance.root.parentNode.removeChild(this.currentOverlay);
        this.currentOverlay = null;

        document.removeEventListener('keyup', this.activeKeyListener);
        this.instance.root.removeEventListener('input', this.activeKeyListener);

        this.userSelectValue = '';

        this.destroyModules();
        this.currentSelectedImage = null;
    }

    private showSelection(element: HTMLElement) {
        this.currentSelectedImage = element;

        if (this.currentOverlay)
            this.hideSelection();

        this.instance.setSelection(null);
        this.userSelectValue = 'none';

        document.addEventListener('keyup', this.activeKeyListener, true);
        this.instance.root.addEventListener('input', this.activeKeyListener, true);

        this.createOverlayElement();
        this.instance.root.parentNode.appendChild(this.currentOverlay);

        this.reposition();
        this.initModules();
    }

    private createOverlayElement(): HTMLElement {
        this.currentOverlay = document.createElement('div');

        var self = this;
        Object.keys(this._options.overlayStyles).forEach(function (key) {
            self.currentOverlay.style[key] = self._options.overlayStyles[key];
        });

        return this.currentOverlay;
    }

    private reposition() {
        if (!this.currentOverlay || !this.currentSelectedImage)
            return;

        let parent = this.instance.root.parentElement;
        let imgRect = (<Element>this.currentSelectedImage).getBoundingClientRect();
        let containerRect = parent.getBoundingClientRect();

        let repositionData = {
            left: `${imgRect.left - containerRect.left - 1 + parent.scrollLeft}px`,
            top: `${imgRect.top - containerRect.top + parent.scrollTop}px`,
            width: `${imgRect.width}px`,
            height: `${imgRect.height}px`,
        }
    }

    public onUpdate() {
        this.reposition();

        this.modules.forEach(function (module) {
            module.onUpdate();
        });
    }

    private set userSelectValue(value: string) {
        var self = this;
        ['userSelect', 'mozUserSelect', 'webkitUserSelect', 'msUserSelect'].forEach(function (key) {
            self.instance.root.style[key] = value;
            document.documentElement.style[key] = value;
        });
    }

    private activeKeyListener(event: KeyboardEvent) {
        if (this.currentSelectedImage) {
            if (event.keyCode == 46 || event.keyCode == 8)
                (<any>Quill).find(this.currentSelectedImage).deleteAt(0);
        }
    }

    public get overlay() {
        return this.currentOverlay;
    }

    public get image() {
        return this.currentSelectedImage;
    }

    public get options() {
        return this._options;
    }
}