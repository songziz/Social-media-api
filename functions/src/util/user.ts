

interface FirebaseRequests {
  incoming: string[],
  outgoing: string[],
}

class User {
  username : string;
  friends : string[];
  events : string[];
  tags : any;
  icon : string;
  friendRequests : [string[], string[]]; // 2 string arrays, first is outgoing, 2nd incoming
  uid : string;

  constructor(username: string, friends : string[], events : string[],
    tags : any, icon : string, friendRequests : [string[], string[]], uid: string) {
      this.username = username;
      this.friends = friends;
      this.events = events;
      this.tags = tags;
      this.icon = icon;
      this.friendRequests = friendRequests;
      this.uid = uid;
  }

  static friendRequestsFromFS(obj: FirebaseRequests) : [string[], string[]] {
    const result : [string[], string[]] = [obj.outgoing, obj.incoming];
    return result;
  }

  static friendRequestsToFS(obj: [string[], string[]]) : FirebaseRequests {
    const result = {
      incoming: obj[1],
      outgoing: obj[0],
    };
    return result;
  }
}

export default User;