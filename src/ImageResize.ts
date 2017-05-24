import { assign, merge } from 'lodash';
import * as Quill from 'quill';
import { DefaultOptions, IDefaultOptions } from './DefaultOptions';
import { DisplaySize } from './modules/DisplaySize';
import { Resize } from './modules/Resize';
import { Toolbar } from './modules/Toolbar';

type KnownModule = DisplaySize | Resize | Toolbar;
const knownModules: {} = { DisplaySize, Resize, Toolbar };

// Quill.d.ts from official repository doesn't contain all elements available from the quill instance. The missing properties are defined here:
export interface IQuillInstance extends Quill.Quill {
    root: HTMLElement;
    container: HTMLElement;

    editor: any; // Editor
    emitter: any; // Emitter
    history: any; // History
    keyboard: Quill.KeyboardStatic;
    options: {
        bounds: Quill.BoundsStatic,
        container: HTMLElement,
        modules: Object,
        placeholder: string,
        readonly: boolean,
        scrollingContainer: HTMLElement,
        strict: boolean,
        theme: (quill: IQuillInstance, options: IDefaultOptions) => void
    };
    scroll: any; // Scroll
    scrollingContainer: HTMLElement;
    selection: any; // Selection,
    theme: any; // Current Theme for Quill.Editor SnowTheme
}

interface IImageResizeListeners {
    onRootClick: (event: MouseEvent) => void;
    onKeyUp: (event: KeyboardEvent) => void;
}
/**
 * Enables Image Resizing on image elements in a Quill.Editor
 *
 * @export
 * @class ImageResize
 */
export class ImageResize {
    private _options: IDefaultOptions; // Options for current module, see DefaultOptions for a full list of available options
    private instance: IQuillInstance; // Instance of the quill editor, to setup listeners and retrieving data from the editor (e.g. image)
    private currentSelectedImage: EventTarget | Element; // The image activated / clicked

    private currentOverlay: HTMLElement; // Selection overlay, for highlighting a selected image

    private modules: any[]; // Internal modules enabled

    private listeners: IImageResizeListeners; // Listeners for click&key events. Used for storing functions, rather than creating duplicates for each call

    constructor(quill: IQuillInstance, options: IDefaultOptions) {
        this.instance = quill;
        // Merge default options, overwrite with any passed in options
        this._options = merge({}, DefaultOptions, options);

        this.listeners = {
            onRootClick: this.onRootClick(),
            onKeyUp: this.onKeyUp()
        };

        // Disable native image resize in firefox
        document.execCommand('enableObjectResizing', false, 'false');

        this.instance.root.addEventListener('click', this.listeners.onRootClick, false);
        this.instance.root.parentElement.style.position = this.instance.root.parentElement.style.position || 'relative';

        this.modules = [];
    }

    /**
     * Re-initialize all internal modules, to active them
     *
     * @private
     *
     * @memberof ImageResize
     */
    private initModules(): void {
        let self = this;
        this.destroyModules();

        if (this._options.modules)
            this.modules = this._options.modules.map(
                function (mclass: string | KnownModule): void {
                    return new (knownModules[<string>mclass] || mclass)(self);
                }
            );

        this.modules.forEach(function (module: KnownModule): void {
            module.onCreate();
        });
        this.onUpdate();
    }

    private destroyModules(): void {
        this.modules.forEach(function (module: KnownModule): void {
            module.onDestroy();
        });
        this.modules = [];
    }

    /**
     * Event Handler to run when an element is clicked inside the Quill editor
     * Checks if the selected element is an image, and creates an overlay of the selected element
     *
     * @private
     * @returns {(evt: Event) => void}
     *
     * @memberof ImageResize
     */
    private onRootClick(): (evt: Event) => void {
        let self = this;

        return function (event: Event): void {
            if (event.target && event.target['tagName'] && event.target['tagName'].toUpperCase() === 'IMG') {

                if (self.currentSelectedImage === event.target)
                    return; // Focuse is already up and running
                else if (self.currentSelectedImage)
                    self.hideSelection();

                self.showSelection(<HTMLElement>event.target);
            }
            else if (self.currentSelectedImage)
                self.hideSelection();
        };
    }

    /**
     * Hide the active overlay of active image
     *
     * @private
     * @returns
     *
     * @memberof ImageResize
     */
    private hideSelection(): void {
        if (!this.currentSelectedImage)
            return;

        this.instance.root.parentNode.removeChild(this.currentOverlay);
        this.currentOverlay = null;

        document.removeEventListener('keyup', this.listeners.onKeyUp);
        this.instance.root.removeEventListener('input', this.listeners.onKeyUp);

        this.userSelectValue = '';

        this.destroyModules();
        this.currentSelectedImage = null;
    }

    /**
     * SHow the overlay of the image clicked
     *
     * @private
     * @param {HTMLElement} element
     *
     * @memberof ImageResize
     */
    private showSelection(element: HTMLElement): void {
        this.currentSelectedImage = element;

        if (this.currentOverlay)
            this.hideSelection();

        this.instance.setSelection(null);
        this.userSelectValue = 'none';

        document.addEventListener('keyup', this.listeners.onKeyUp, true);
        this.instance.root.addEventListener('input', this.listeners.onKeyUp, true);

        this.createOverlayElement();
        this.instance.root.parentNode.appendChild(this.currentOverlay);

        this.reposition();
        this.initModules();
    }

    private createOverlayElement(): HTMLElement {
        this.currentOverlay = document.createElement('div');
        assign(this.currentOverlay.style, this._options.overlayStyles);

        return this.currentOverlay;
    }

    /**
     * Repositions the overlay, to follow the bound of the selected image
     *
     * @private
     * @returns
     *
     * @memberof ImageResize
     */
    private reposition(): void {
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
        };

        assign(this.currentOverlay.style, repositionData);
    }

    /**
     * Updates each internal module
     *
     * @memberof ImageResize
     */
    public onUpdate(): void {
        this.reposition();

        this.modules.forEach(function (module: KnownModule): void {
            module.onUpdate();
        });
    }

    private set userSelectValue(value: string) {
        let self = this;
        ['userSelect', 'mozUserSelect', 'webkitUserSelect', 'msUserSelect'].forEach(function (key: string): void {
            self.instance.root.style[key] = value;
            document.documentElement.style[key] = value;
        });
    }

    /**
     * Key Handler, for removing an image when DELETE or BACKSPACE is pressed
     *
     * @private
     * @returns {(event: KeyboardEvent) => void}
     *
     * @memberof ImageResize
     */
    private onKeyUp(): (event: KeyboardEvent) => void {
        let self = this;
        const KEYCODE_BACKSPACE = 8;
        const KEYCODE_DELETE = 46;

        return function (event: KeyboardEvent): void {
            if (self.currentSelectedImage) {
                if (event.keyCode === KEYCODE_DELETE || event.keyCode === KEYCODE_BACKSPACE)
                    (<any>Quill).find(self.currentSelectedImage).deleteAt(0);
            }

        };
    }

    public get overlay(): HTMLElement {
        return this.currentOverlay;
    }

    public get image(): Element | EventTarget {
        return this.currentSelectedImage;
    }

    public get options(): IDefaultOptions {
        return this._options;
    }
}
