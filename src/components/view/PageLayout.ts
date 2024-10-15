import { ensureElement } from "../../utils/utils";
import { Component } from "../base/Component";
import { IEvents } from "../base/events";
import { IListItems, ListView } from "../common/List";
import { CatalogItemStatus } from "./AuctionCards";

interface IPageLayout {
    counter: number,
    locked: boolean,
    catalog: IListItems<CatalogItemStatus>
}

export class PageLayout extends Component<IPageLayout> {
    protected pageWrapper: HTMLElement;
    protected basketCounter: HTMLElement;
    protected basketButton: HTMLElement;
    protected catalogHolder: HTMLElement;
    protected catalogList: ListView<CatalogItemStatus, IListItems<CatalogItemStatus>>;


    constructor(container: HTMLElement, protected eventSystem: IEvents) {
        super(container);

        this.pageWrapper = ensureElement<HTMLElement>('.page__wrapper');
        this.basketCounter = ensureElement<HTMLElement>('.header__basket-counter');
        this.basketButton = ensureElement<HTMLElement>('.header__basket');
        this.catalogHolder = ensureElement<HTMLElement>('.catalog__items');
        this.catalogList = new ListView(this.catalogHolder);

        this.basketButton.addEventListener('click', () => {
            this.eventSystem.emit('bids:open');
        });
    }

    set counter(value: number) {
        this.setText(this.basketCounter, String(value));
    }

    set catalog(items: IListItems<CatalogItemStatus>) {
        this.catalogList.render(items);
    }

    set locked(value: boolean) {
        this.toggleClass(this.pageWrapper, 'page__wrapper_locked', value);
    }
}