import { FormErrors, ILot, IOrder, IOrderForm, IUserStatus, LotStatus } from "../types";
import { dayjs } from "../utils/utils";
import { Model } from "./base/Model";

export class LotModel extends Model<ILot> {
    private static readonly closeMultiplier = 10;
    private static readonly increaseMinimum = 100;

    // ILotItem
    id: string;
    title: string;
    about: string;
    description: string;
    image: string;
    // IAuction
    status: LotStatus;
    datetime: string;
    price: number;
    minPrice: number;
    history: number[];

    privateLastBid: number = 0;

    placeBid(price: number): void {
        this.price = price;
        this.history = [...this.history, price];
        this.privateLastBid = price;

        if (price >= this.minPrice * LotModel.closeMultiplier) {
            this.status = 'closed';
        }
        this.emitChanges('auction:changed', { id: this.id, price });
    }

    removeBid(): void {
        this.privateLastBid = 0;
    }

    userLeads(): boolean {
        return this.privateLastBid == this.price;
    }

    userParticipates(): boolean {
        return this.privateLastBid != 0;
    }

    timeStatusText(): string {
        switch (this.status) {
            case "active":
                return `Открыто до ${this.datetime}`
            case "closed":
                return `Закрыто ${this.datetime}`
            case "wait":
                return `Откроется ${this.datetime}`
        }
    }

    auctionStatusText(): string {
        switch (this.status) {
            case 'active':
                return 'До закрытия лота';
            case 'closed':
                return `Продано за ${this.price}`;
            case 'wait':
                return 'До начала аукциона';
        }
    }

    leftTime(): string {
        if (this.status == 'closed') return 'Аукцион завершен';
        return dayjs.duration(dayjs(this.datetime).valueOf() - Date.now()).format('D [дней] H [часов] M [минут] S [секунд]');
    }

    bidMinimum(): number {
        return this.price + LotModel.increaseMinimum;
    }
}

export class UserStatus extends Model<IUserStatus> {
    lots: LotModel[];
    basket: string[];
    order: IOrder = {
        email: '',
        phone: '',
        items: []
    };
    formErrors: FormErrors = {};
    previewLot: LotModel;

    changeOrderStatus(id: string, toAdd: boolean) {
        if (toAdd && this.order.items.findIndex((elem) => elem==id) == -1) {
            this.order.items = [...this.order.items, id];
        } else if (!toAdd && this.order.items.findIndex((elem) => elem==id) != -1) {
            this.order.items = this.order.items.filter((elem)=>elem!=id);
        }
    }

    clearBasket() {
        this.order.items.forEach(id => {
            this.changeOrderStatus(id, false);
            this.lots.find(it => it.id === id).removeBid();
        });
    }

    getTotal() {
        return this.order.items.reduce((value, id) => value + this.lots.find(lot => lot.id == id).price, 0);
    }

    setLots(items: ILot[]) {
        this.lots = items.map(item => new LotModel(item, this.events));
        this.emitChanges('items:changed', { lots: this.lots });
    }

    setPreview(item: LotModel) {
        this.previewLot = item;
        this.emitChanges('preview:changed', item);
    }

    getLotsByStatus(status: string, participate?: boolean, winning?: boolean): LotModel[] {
        return this.lots.filter(lot => 
            lot.status === status && 
            (participate ? lot.userParticipates() : true) && 
            (winning ? lot.userLeads() : true));
    }

    setOrderField(field: keyof IOrderForm, value: string) {
        this.order[field] = value;

        if (this.validateOrder()) {
            this.events.emit('order:ready', this.order);
        }
    }

    validateOrder(): boolean {
        const errors: FormErrors = {};
        if (!this.order.email) {
            errors.email = 'Необходимо указать почту';
        }
        if (!this.order.phone) {
            errors.phone = 'Необходимо указать телефон';
        }
        this.formErrors = errors;
        this.events.emit('formErrors:change', this.formErrors);
        return Object.keys(errors).length == 0;
    }
}
