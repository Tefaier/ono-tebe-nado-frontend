import { Component } from "../base/Component";

interface IOrderFinish {
    total: number;
}

export class OrderFinish extends Component<IOrderFinish> {
    protected actionElement: HTMLElement;

    constructor(container: HTMLElement, onClick?: () => void) {
        super(container);

        this.actionElement = this.container.querySelector('.state__action');
        if (onClick) {
            this.actionElement.addEventListener('click', onClick);
        }
    }

    set total(value: number) {
        // no use
    }
}