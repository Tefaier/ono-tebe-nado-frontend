import { Component } from "../base/Component";

export interface IListItem<T> {
    item: {
        render(state: T): HTMLElement
    }
    values: T
}

export interface IListItems<T> {
    items: IListItem<T>[]
}

export class ListView<K, T extends IListItems<K>> extends Component<T> {
    set items(value: T) {
        this.container.replaceChildren(...value.items.map(item => item.item.render(item.values)));
    }

    render(state: T) {
        super.render(state);
        return this.container;
    }
}