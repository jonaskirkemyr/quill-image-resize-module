import { assign } from 'lodash';
import * as Quill from 'quill';
import { ImageResize } from '../ImageResize';
import { BaseModule } from './BaseModule';

import * as IconAlignCenter from 'quill/assets/icons/align-center.svg';
import * as IconAlignLeft from 'quill/assets/icons/align-left.svg';
import * as IconAlignRight from 'quill/assets/icons/align-right.svg';

/**
 * Interface describing properties required by the toolbar
 *
 * @interface AlignmentElement
 */
interface AlignmentElement {
    icon: any; // SVG icon to display
    apply: () => void; // Function to activate styles for current image
    isApplied: () => boolean; // Check whether a style is already activated for current alignment
}

const Parchment = Quill.import('parchment');
const FloatStyle = new Parchment.Attributor.Style('float', 'float');
const MarginStyle = new Parchment.Attributor.Style('margin', 'margin');
const DisplayStyle = new Parchment.Attributor.Style('display', 'display');

/**
 * Appends a simple toolbar to images, for aligning an image left, center, or right
 *
 * @export
 * @class Toolbar
 * @extends {BaseModule}
 */
export class Toolbar extends BaseModule {
    private toolbarElement: HTMLElement;

    public onCreate(): void {
        this.toolbarElement = document.createElement('div');
        assign(this.toolbarElement.style, this.options.toolbarStyles);
        this.overlay.appendChild(this.toolbarElement);

        this.createToolbarButtons();
    }

    /**
     * Creates Toolbar buttons to display when an image is "active"
     *
     * @private
     *
     * @memberof Toolbar
     */
    private createToolbarButtons(): void {
        let buttons = [];
        let self = this;

        let alignments = this.createAlignments();
        for (let i = 0; i < alignments.length; ++i) {
            let toolbarButton = document.createElement('span');
            toolbarButton.innerHTML = alignments[i].icon;

            toolbarButton.addEventListener('click', function (event: Event): void {
                buttons.forEach(button => button.style.filter = '');

                if (alignments[i].isApplied()) {
                    FloatStyle.remove(self.img);
                    MarginStyle.remove(self.img);
                    DisplayStyle.remove(self.img);
                    // Important to reset already assigned class
                    self.img.className = '';
                }
                else {
                    // Important to reset already assigned class, preventing multiple classes to be assigned to the image, before applying a new style
                    self.img.className = '';
                    this.style.filter = 'invert(20%)';
                    alignments[i].apply();
                }

                self.imageResize.onUpdate();
            });
            assign(toolbarButton.style, this.options.toolbarButtonStyles);
            if (i > 0)
                toolbarButton.style.borderLeftWidth = '0';

            assign((<HTMLElement>toolbarButton.children[0]).style, this.options.toolbarButtonSvgStyles);
            if (alignments[i].isApplied())
                toolbarButton.style.filter = 'invert(20%)';

            buttons.push(toolbarButton);
            this.toolbarElement.appendChild(toolbarButton);
        }
    }

    /**
     * Create the different alignment styles when the different alignment buttons are activated
     *
     * @private
     * @returns
     *
     * @memberof Toolbar
     */
    private createAlignments(): AlignmentElement[] {
        let left: AlignmentElement = {
            icon: IconAlignLeft,
            apply: () => {
                FloatStyle.add(this.img, 'left');
                MarginStyle.add(this.img, '0 1em 1em 0');
                DisplayStyle.add(this.img, 'inline');
                this.img.classList.add('quill-align-left');
            },
            isApplied: () => {
                return this.img.classList.contains('quill-align-left');
            }
        };

        let center: AlignmentElement = {
            icon: IconAlignCenter,
            apply: () => {
                FloatStyle.remove(this.img);
                MarginStyle.add(this.img, 'auto');
                DisplayStyle.add(this.img, 'block');
                this.img.classList.add('quill-align-center');
            },
            isApplied: () => {
                return this.img.classList.contains('quill-align-center');
            }
        };

        let right: AlignmentElement = {
            icon: IconAlignRight,
            apply: () => {
                FloatStyle.add(this.img, 'right');
                MarginStyle.add(this.img, '0 0 1em 1em');
                DisplayStyle.add(this.img, 'inline');
                this.img.classList.add('quill-align-right');
            },
            isApplied: () => {
                return this.img.classList.contains('quill-align-right');
            }
        };

        return [left, center, right];
    }

    public onDestroy(): void {
        // Doesn't require implementation
    }

    public onUpdate(): void {
        // Doesn't require implementation
    }
}
