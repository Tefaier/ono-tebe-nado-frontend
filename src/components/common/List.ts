import { createElement } from "../../utils/utils";
import { Component } from "../base/Component";

export interface IListItems {
    items: HTMLElement[]
}

export class ListView extends Component<IListItems> {
    constructor(container: HTMLElement, protected textOnEmpty: string, protected elementToWrite?: HTMLElement) {
        super(container);
        this.elementToWrite = elementToWrite ?? container;
    }

    set items(items: HTMLElement[]) {
        if (items.length > 0) {
            this.elementToWrite.replaceChildren(...items);
        } else {
            this.elementToWrite.replaceChildren(createElement<HTMLElement>('p', {textContent: this.textOnEmpty}));
        }
    }

    render(state: IListItems) {
        super.render(state);
        return this.container;
    }
}