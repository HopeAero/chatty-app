export interface Room {
    _id:       string;
    name?:     string;
    type:      string;
    members:   Member[];
    messages?:  Message[];
    lastMessage?: Message;
    createdAt: Date;
    updatedAt: Date;
    __v:       number;
}

export interface Member {
    userId:   string;
    username: string;
    _id:      string;
}

export interface Message {
    senderId:  string;
    contents:  string;
    _id:       string;
    createdAt: Date;
    updatedAt: Date;
}

export interface responseMessage {
    roomId:   string;
    senderId: string;
    contents: string;
    _id:       string;
    createdAt: Date;
    updatedAt: Date;

}

