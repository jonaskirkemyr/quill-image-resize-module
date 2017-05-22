import { ImageResize } from '../ImageResize';

export interface IBaseModule {
    onCreate(): void;
    onDestroy(): void;
    onUpdate(): void;
}

export abstract class BaseModule implements IBaseModule {
    protected overlay: HTMLElement;
    protected img: HTMLImageElement;
    protected options;
    protected requestUpdate;

    public constructor(resize: ImageResize) {
        this.overlay = resize.overlay;
        this.img = <HTMLImageElement>resize.image;
        this.options = resize.options;
        this.requestUpdate = resize.onUpdate;
    }

    abstract onCreate();
    abstract onDestroy();
    abstract onUpdate();
}