import {
  IonAlert,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
  useIonViewDidEnter,
  useIonViewWillEnter,
} from "@ionic/react";
import { useState } from "react";
import "./main.css";
import { trash, openOutline } from "ionicons/icons";
import * as SubListDatabase from "../database/SubListDatabase";
import { Browser } from "@capacitor/browser";
import moment from "moment";
import { RouteComponentProps } from "react-router";
import { useHistory } from "react-router-dom";
import { LocalNotifications } from "@capacitor/local-notifications";

declare type ScheduleEvery =
  | "year"
  | "month"
  | "two-weeks"
  | "week"
  | "day"
  | "hour"
  | "minute"
  | "second";

interface ViewPageProps
  extends RouteComponentProps<{
    id: string;
  }> {}

const Home: React.FC<ViewPageProps> = ({ match }) => {
  const history = useHistory();

  const [deleteAlert, setDeleteAlert] = useState(false);

  const subId = match.params.id;
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [period, setPeriod] = useState<ScheduleEvery>("month");
  const [startDate, setStartDate] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [URL, setURL] = useState("");
  const [notify, setNotify] = useState(true);
  const [notificationId, setNotificationId] = useState<number>();
  const [note, setNote] = useState("");
  const [createdOn, setCreatedOn] = useState("");

  const [isEditing, setIsEditing] = useState(false);

  useIonViewWillEnter(() => {
    init();
  });

  useIonViewDidEnter(async () => {
    const db = await SubListDatabase.get();
    try {
      await db.sublist
        .find()
        .where("subId")
        .eq(subId)
        .exec()
        .then((list: any) => {
          setStartDate(list[0].startDate);
        });
    } catch (e) {
      console.log(e);
      window.location.href = "/";
    }
  });

  async function init() {
    const db = await SubListDatabase.get();
    try {
      await db.sublist
        .find()
        .where("subId")
        .eq(subId)
        .exec()
        .then((list: any) => {
          setName(list[0].name);
          setIcon(list[0].icon);
          setPeriod(list[0].period);
          setStartDate(list[0].startDate);
          setNextDate(list[0].nextDate);
          setURL(list[0].url);
          setNotify(list[0].notify);
          setNotificationId(list[0].notificationId);
          setNote(list[0].note);
          setCreatedOn(list[0].createdOn);
        });
    } catch (e) {
      console.log(e);
    }
  }

  function calculateDates(startDate: string, period: ScheduleEvery) {
    setStartDate(moment(startDate).format("YYYY-MM-DD"));
    setPeriod(period);
    var date = new Date(startDate);
    var t = moment();
    var d = moment(date);
    switch (period) {
      case "day":
        while (d.isSameOrBefore(t, "day")) {
          d.add(1, "d");
        }
        setNextDate(d.format("YYYY-MM-DD"));
        break;
      case "week":
        while (d.isSameOrBefore(t, "day")) {
          d.add(1, "w");
        }
        setNextDate(d.format("YYYY-MM-DD"));
        break;
      case "month":
        while (d.isSameOrBefore(t, "day")) {
          d.add(1, "M");
        }
        setNextDate(d.format("YYYY-MM-DD"));
        break;
      case "year":
        while (d.isSameOrBefore(t, "day")) {
          d.add(1, "y");
        }
        setNextDate(d.format("YYYY-MM-DD"));
        break;
      default:
        setNextDate(moment(date).format("YYYY-MM-DD"));
        break;
    }
  }

  async function deleteItem() {
    const db = await SubListDatabase.get();
    try {
      await db.sublist.find().where("subId").equals(subId).remove();
      history.go(-1);
    } catch (e) {
      console.log(e);
    }
  }

  async function editItem() {
    const db = await SubListDatabase.get();
    const prop = {
      title: name,
      body: "Subscription for " + name + " is coming tomorrow.",
      id: parseInt(subId, 16),
      extra: {
        id: notificationId,
      },
      schedule: {
        at: new Date(nextDate),
        every: period,
      },
    };
    LocalNotifications.checkPermissions().then((permissions) => {
      if (permissions.display === "granted") {
        LocalNotifications.schedule({
          notifications: [prop],
        });
      }
    });
    try {
      await db.sublist
        .find()
        .where("subId")
        .equals(subId)
        .update({
          $set: {
            name: name,
            icon: icon || "",
            period: period,
            startDate: startDate,
            nextDate: nextDate,
            url: URL || "",
            notify: notify,
            note: note || "",
          },
        });
      setIsEditing(false);
    } catch (e: any) {
      alert(e.message);
      console.log(e);
    }
  }

  function turnNotificationOn() {
    LocalNotifications.checkPermissions().then((permissions) => {
      if (permissions.display === "granted") {
        setNotify(true);
      } else {
        LocalNotifications.requestPermissions().then((permissions) => {
          if (permissions.display === "granted") {
            setNotify(true);
          } else {
            alert("Notification permissions are necessary for notifications.");
          }
        });
      }
    });
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>{name}</IonTitle>
          <IonButtons slot="primary">
            {isEditing ? (
              <IonButton onClick={() => editItem()}>Save</IonButton>
            ) : (
              <IonButton onClick={() => setIsEditing(true)}>Edit</IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen scrollEvents>
        <div className="icon-container"></div>
        <IonList>
          <IonItem>
            <IonLabel>
              <strong>Name</strong>
            </IonLabel>
            <IonInput
              value={name}
              placeholder="Enter Name"
              onIonChange={(e) => setName(e.detail.value!)}
              readonly={!isEditing}
            ></IonInput>
          </IonItem>
          <IonItem>
            {isEditing ? (
              <IonDatetime
                value={startDate}
                presentation={"date"}
                placeholder="Select Start Date"
                onIonChange={(e) => calculateDates(e.detail.value!, period)}
                readonly={!isEditing}
              >
                <div slot="title">Start Date</div>
              </IonDatetime>
            ) : (
              <>
                <IonLabel>
                  <strong>Start Date</strong>
                </IonLabel>
                <IonLabel className="ion-text-right">
                  {moment(startDate).format("YYYY-MM-DD")}
                </IonLabel>
              </>
            )}
          </IonItem>
          <IonItem>
            <IonLabel>
              <strong>Period</strong>
            </IonLabel>
            <IonSelect
              value={period}
              multiple={false}
              cancelText="Cancel"
              okText="Select"
              onIonChange={(e) => calculateDates(startDate, e.detail.value)}
              disabled={!isEditing}
            >
              <IonSelectOption value="day">Daily</IonSelectOption>
              <IonSelectOption value="week">Weekly</IonSelectOption>
              <IonSelectOption value="month">Monthly</IonSelectOption>
              <IonSelectOption value="year">Yearly</IonSelectOption>
              {/* <IonSelectOption value="custom">Custom</IonSelectOption> */}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel>
              <strong>Next Date</strong>
            </IonLabel>
            <IonLabel className={"ion-text-right"}>
              <h2>{nextDate}</h2>
              <p>{moment(nextDate).fromNow()}</p>
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel>
              <strong>URL</strong>
            </IonLabel>
            <IonInput
              value={URL}
              placeholder="Enter URL"
              onIonChange={(e) => setURL(e.detail.value!)}
              readonly={!isEditing}
            ></IonInput>
            {!isEditing ? (
              <IonButton
                fill={"clear"}
                onClick={async () => await Browser.open({ url: URL })}
              >
                <IonIcon icon={openOutline} />
              </IonButton>
            ) : null}
          </IonItem>
          <IonItem>
            <IonLabel>
              <strong>Notify</strong>
            </IonLabel>
            <IonToggle
              checked={notify}
              onIonChange={(e) =>
                !notify ? turnNotificationOn() : setNotify(false)
              }
              disabled={!isEditing}
            />
          </IonItem>
          <IonItem>
            <IonLabel>
              <strong>Note</strong>
            </IonLabel>
            <IonTextarea
              value={note}
              auto-grow
              readonly={!isEditing}
              placeholder="Note"
              onIonChange={(e) => setNote(e.detail.value!)}
            ></IonTextarea>
          </IonItem>
          <IonItem>
            <IonLabel>
              <strong>Created on</strong>
            </IonLabel>
            <IonLabel className={"ion-text-right"}>{createdOn}</IonLabel>
          </IonItem>
        </IonList>
        <IonButton
          color="danger"
          expand="block"
          onClick={() => setDeleteAlert(true)}
        >
          <IonIcon icon={trash} />
        </IonButton>
      </IonContent>
      <IonAlert
        isOpen={deleteAlert}
        onDidDismiss={() => setDeleteAlert(false)}
        header={"This cannot be undone."}
        buttons={[
          {
            text: "Delete",
            cssClass: "danger",
            handler: () => {
              deleteItem();
            },
          },
          {
            text: "Cancel",
            role: "cancel",
          },
        ]}
      />
    </IonPage>
  );
};

export default Home;
