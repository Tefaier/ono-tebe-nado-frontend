import {Component} from "../base/Component";
import {ensureAllElements} from "../../utils/utils";

export type TabState = {
    selected: string
};

export type TabChooseAction = {
    onClick: (tab: string) => void
};

export class Tabs extends Component<TabState> {
    protected tabButtons: HTMLButtonElement[];

    constructor(container: HTMLElement, action?: TabChooseAction) {
        super(container);

        this.tabButtons = ensureAllElements<HTMLButtonElement>('.button', container);

        if (action) {
            this.tabButtons.forEach(button => button.addEventListener('click', () => action.onClick(button.name)));
        }
    }

    set selected(name: string) {
        this.tabButtons.forEach(button => {
            this.toggleClass(button, 'tabs__item_active', button.name == name);
            this.setDisabled(button, button.name == name)
        });
    }
}