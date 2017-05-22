import { BaseModule } from './BaseModule';

export class DisplaySize extends BaseModule {

    private display: HTMLElement;

    public onCreate() {
        this.display = document.createElement('div');

        var self = this;
        Object.keys(this.options.displayStyles).forEach(function (key) {
            self.display.style[key] = self.options.displayStyles[key];
        });

        this.overlay.appendChild(this.display);
    }

    public onDestroy() {

    }

    public onUpdate() {
        if (!this.display || !this.img)
            return;

        const size = this.getCurrentSize();
        this.display.innerHTML = size.join(' &times; ');

        if (size[0] > 120 && size[1] > 30) {
            // Position - top of image
            this.display.style.right = '4px';
            this.display.style.bottom = '4px';
            this.display.style.left = 'auto';
        }
        else if (this.img.style['float'] == 'right') {
            // Position - bottom left
            const bounds = this.display.getBoundingClientRect();
            this.display.style.right = 'auto';
            this.display.style.bottom = (bounds.height + 4) + 'px';
            this.display.style.left = (bounds.width + 4) + 'px';
        }
        else {
            // Position - bottom right
            const bounds = this.display.getBoundingClientRect();
            this.display.style.right = (bounds.width + 4) + 'px';
            this.display.style.bottom = (bounds.height + 4) + 'px';
            this.display.style.left = 'auto';
        }

    }

    private getCurrentSize(): number[] {
        return [
            this.img.width,
            Math.round((this.img.width / this.img.naturalWidth) * this.img.naturalHeight)
        ];
    }


}