import { LotStatus } from "../../types";
import { createElement, ensureElement, formatNumber } from "../../utils/utils";
import { Component } from "../base/Component";

export interface ICard<T> {
    title: string;
    image: string;
    description?: string[];
    status: T;
}

export class Card<T> extends Component<ICard<T>> {
    protected titleElement: HTMLElement;
    protected imageElement?: HTMLImageElement;
    protected descriptionElement?: HTMLElement;
    protected buttonElement?: HTMLButtonElement;

    constructor(baseClassName: string, container: HTMLElement, onClick?: (event: MouseEvent) => void) {
        super(container);

        this.titleElement = container.querySelector(`.${baseClassName}__title`);
        this.imageElement = container.querySelector(`.${baseClassName}__image`);
        this.descriptionElement = container.querySelector(`.${baseClassName}__description`);
        this.buttonElement = container.querySelector(`.${baseClassName}__button`);

        if (onClick) {
            if (this.buttonElement) {
                this.buttonElement.addEventListener('click', onClick);
            } else {
                container.addEventListener('click', onClick);
            }
        }
    }

    set id(value: string) {
        this.container.dataset.id = value;
    }

    get id(): string {
        return this.container.dataset.id ?? '';
    }

    set title(value: string) {
        this.setText(this.titleElement, value);
    }

    get title(): string {
        return this.titleElement.textContent ?? '';
    }

    set image(value: string) {
        this.setImage(this.imageElement, value, this.title)
    }

    set description(values: string[]) {
        const replacement = values.map(str => {
            const copy = this.descriptionElement.cloneNode() as HTMLElement;
            this.setText(copy, str);
            return copy;
        })
        this.descriptionElement.replaceWith(...replacement);
    }
}

export type CatalogItemStatus = {
    statusName: LotStatus,
    label: string,
};

export class CatalogItem extends Card<CatalogItemStatus> {
    private static readonly baseClassName = 'card';
    protected statusElement: HTMLElement;

    constructor(container: HTMLElement, onClick?: (event: MouseEvent) => void) {
        super(CatalogItem.baseClassName, container, onClick);
        this.statusElement = container.querySelector(`.${CatalogItem.baseClassName}__status`);
    }

    set status(status: CatalogItemStatus) {
        this.setText(this.statusElement, status.label);
        let className = `${CatalogItem.baseClassName}__${status.statusName}`;
    }
}

export interface BidItemStatus {
    amount: number;
    status: boolean;
}

export class BidItem extends Card<BidItemStatus> {
    private static readonly baseClassName = 'bid';
    protected amountElement: HTMLElement;
    protected statusElement: HTMLElement;
    protected selectorElement: HTMLInputElement;

    constructor(container: HTMLElement, onClick?: (event: MouseEvent) => void) {
        super(BidItem.baseClassName, container, onClick);
        this.amountElement = container.querySelector(`.${BidItem.baseClassName}__amount`);
        this.statusElement = container.querySelector(`.${BidItem.baseClassName}__status`);
        this.selectorElement = container.querySelector(`.${BidItem.baseClassName}__selector-input`);

        if (!this.buttonElement && onClick) {
            this.selectorElement?.addEventListener('change', onClick)
            this.container.removeEventListener('click', onClick);
        }
    }

    set status(status: BidItemStatus) {
        this.setText(this.amountElement, formatNumber(status.amount));

        if (status.status) {
            this.setVisible(this.statusElement);
        } else {
            this.setHidden(this.statusElement);
        }
    }
}

export type AuctionItemStatus = {
    statusName: LotStatus,
    time: string,
    label: string,
    nextBid: number,
    history: number[]
};

export class AuctionItem extends Card<AuctionItemStatus> {
    private static readonly baseClassName = 'lot';
    protected statusElement: HTMLElement;
    protected timeElement: HTMLElement;
    protected labelElement: HTMLElement;
    protected buttonElement: HTMLButtonElement;
    protected inputElement: HTMLInputElement;
    protected historyElement: HTMLElement;
    protected bidsElement: HTMLElement
    protected formElement: HTMLFormElement;

    constructor(container: HTMLElement, onClick?: (event: MouseEvent) => void, onSubmit?: (price: number) => void) {
        super('lot', container, onClick);
        this.statusElement = container.querySelector(`.${AuctionItem.baseClassName}__status`);
        this.timeElement = container.querySelector(`.${AuctionItem.baseClassName}__auction-timer`);
        this.labelElement = container.querySelector(`.${AuctionItem.baseClassName}__auction-text`);
        this.buttonElement = container.querySelector(`.button`);
        this.inputElement = container.querySelector(`.form__input`);
        this.bidsElement = container.querySelector(`.${AuctionItem.baseClassName}__history-bids`);
        this.historyElement = container.querySelector(`.${AuctionItem.baseClassName}__history`);
        this.formElement = container.querySelector(`.${AuctionItem.baseClassName}__bid`);

        this.formElement.addEventListener('submit', (event) => {
            event.preventDefault();
            onSubmit?.(parseInt(this.inputElement.value));
        });
    }

    set status(status: AuctionItemStatus) {
        Object.assign(this, status);
    }

    set statusName(value: LotStatus) {
        if (value != 'active') {
            this.setHidden(this.historyElement);
            this.setHidden(this.formElement);
        } else {
            this.setVisible(this.historyElement);
            this.setVisible(this.formElement);
        }
    }

    set time(value: string) {
        this.setText(this.timeElement, value);
    }

    set label(value: string) {
        this.setText(this.labelElement, value);
    }

    set nextBid(value: number) {
        this.inputElement.value = String(value);
    }

    set history(value: number[]) {
        this.bidsElement.replaceChildren(...value.map(item => createElement<HTMLUListElement>('li', {
            className: `${AuctionItem.baseClassName}__history-item`,
            textContent: formatNumber(item)
        })));
    }
}
