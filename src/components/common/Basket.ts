import {Component} from "../base/Component";
import {cloneTemplate, createElement, ensureElement, formatNumber} from "../../utils/utils";
import {EventEmitter} from "../base/events";
import {IListItems, ListView } from "./List";

interface IBasketView extends IListItems {
    total: number;
    selected: string[];
}

export class Basket<T> extends ListView {
    protected listElement: HTMLElement;
    protected totalElement: HTMLElement;
    protected buttonElement: HTMLElement;

    constructor(container: HTMLElement, protected events: EventEmitter) {
        super(container, 'Корзина пуста', container.querySelector('.basket__list'));

        this.listElement = this.container.querySelector('.basket__list');
        this.totalElement = this.container.querySelector('.basket__total');
        this.buttonElement = this.container.querySelector('.basket__action');

        this.buttonElement?.addEventListener('click', () => events.emit('order:open'));

        this.items = [];
    }

    set selected(items: string[]) {
        this.setDisabled(this.buttonElement, items.length > 0);
    }

    set total(total: number) {
        this.setText(this.totalElement, formatNumber(total));
    }

    render(state?: IBasketView): HTMLElement {
        if (!state) return this.container;
        const {items, ...other} = state;
        super.render({items});
        Object.assign(this, other);
        return this.container;
    }
}