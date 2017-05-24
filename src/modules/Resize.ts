import { assign } from 'lodash';
import { ImageResize } from '../ImageResize';
import { BaseModule } from './BaseModule';

interface IResizeListeners {
    onMouseDown: (event: MouseEvent) => void;
    onMouseDrag: (event: MouseEvent) => void;
    onMouseRelease: (event: MouseEvent) => void;
}

/**
 * Enables resize of image by dragging the corners of an image
 *
 * @export
 * @class Resize
 * @extends {BaseModule}
 */
export class Resize extends BaseModule {

    private boxes: HTMLElement[];

    private listeners: IResizeListeners;

    // Box to show when a picture is clicked
    private resizeBox: HTMLElement;
    private clickPosition: number;
    private originalWidth: number;

    public constructor(resize: ImageResize) {
        super(resize);
        this.listeners = {
            onMouseDown: this.onMouseDown(),
            onMouseDrag: this.onMouseDrag(),
            onMouseRelease: this.onMouseRelease()
        };
    }

    private onMouseDown(): (event: MouseEvent) => void {
        let self = this;

        return function (event: MouseEvent): void {
            // Create the box for resizing
            self.resizeBox = <HTMLElement>event.target;
            self.clickPosition = event.clientX;
            self.originalWidth = self.img.width || self.img.naturalWidth;

            self.setCursorStyle(self.resizeBox.style.cursor);

            document.addEventListener('mousemove', self.listeners.onMouseDrag);
            document.addEventListener('mouseup', self.listeners.onMouseRelease);
        };
    }

    private onMouseDrag(): (event: MouseEvent) => void {
        let self = this;

        return function (event: MouseEvent): void {
            if (!self.img)
                return;

            let deltaX = event.clientX - self.clickPosition;

            // Left-size resize handler - shrink image
            if (self.resizeBox === self.boxes[0] || self.resizeBox === self.boxes[3])
                self.img.width = Math.round(self.originalWidth - deltaX);
            else // Right-size resize handler - enlare image
                self.img.width = Math.round(self.originalWidth + deltaX);

            self.imageResize.onUpdate();
        };
    }

    private onMouseRelease(): (event: MouseEvent) => void {
        let self = this;

        return function (event: MouseEvent): void {
            self.setCursorStyle('');
            document.removeEventListener('mousemove', self.listeners.onMouseDrag);
            document.removeEventListener('mouseup', self.listeners.onMouseRelease);
        };
    }

    private createBox(cursorType: 'nwse-resize' | 'nesw-resize' | 'nwse-resize' | 'nesw-resize'): HTMLElement {
        let box = document.createElement('div');

        let self = this;
        assign(box.style, this.options.handleStyles);

        box.style.cursor = cursorType;
        box.style.width = this.options.handleStyles.width + 'px';
        box.style.height = this.options.handleStyles.height + 'px';

        box.addEventListener('mousedown', self.listeners.onMouseDown, false);
        this.overlay.appendChild(box);

        return box;
    }

    private positionBoxes(): void {
        let xOffset = (-parseFloat(this.options.handleStyles.width) / 2) + 'px';
        let yOffset = (-parseFloat(this.options.handleStyles.height) / 2) + 'px';

        this.boxes[0].style.left = xOffset;
        this.boxes[0].style.top = yOffset;

        this.boxes[1].style.right = xOffset;
        this.boxes[1].style.top = yOffset;

        this.boxes[2].style.right = xOffset;
        this.boxes[2].style.bottom = yOffset;

        this.boxes[3].style.left = xOffset;
        this.boxes[3].style.bottom = yOffset;
    }



    public onCreate(): void {
        this.boxes = [
            this.createBox('nwse-resize'), // Top Left
            this.createBox('nesw-resize'), // Top right
            this.createBox('nwse-resize'), // Bottom right
            this.createBox('nesw-resize') // Bottom left
        ];

        this.positionBoxes();
    }

    public onDestroy(): void {
        this.setCursorStyle('');
    }

    public onUpdate(): void {

    }

    private setCursorStyle(cursorStyle: string): void {
        document.body.style.cursor = cursorStyle;
        this.img.style.cursor = cursorStyle;
    }
}
