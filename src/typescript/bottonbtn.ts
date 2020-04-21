export interface bottomBtn {
    text: string,
    colorClass: string,
    icon: any,
    onBtnClick: any
}

class BOTTOMBTN implements bottomBtn {
    text: string
    colorClass: string
    icon: any
    onBtnClick: any
}

export default BOTTOMBTN
