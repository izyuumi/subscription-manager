import {
  IonAlert,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
  useIonViewDidEnter,
  useIonViewWillEnter,
} from "@ionic/react";
import { useRef, useState } from "react";
import "./main.css";
import { settings, close, moon, moonOutline, add, trash } from "ionicons/icons";
import * as SubListDatabase from "../database/SubListDatabase";
import moment from "moment";
import { Storage } from "@capacitor/storage";
import { Keyboard, KeyboardStyle } from "@capacitor/keyboard";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Browser } from "@capacitor/browser";
import { LocalNotifications } from "@capacitor/local-notifications";
import { App } from "@capacitor/app";
import githubdark from "../assets/images/github-dark.png";
import githublight from "../assets/images/github-light.png";
import bluelockorg from "../assets/logos/bluelockorg.png";
import { useTranslation, Trans } from "react-i18next";

declare type ScheduleEvery =
  | "year"
  | "month"
  | "two-weeks"
  | "week"
  | "day"
  | "hour"
  | "minute"
  | "second";

interface listItem {
  subId: string;
  icon?: string;
  name: string;
  startDate: string;
  period: string;
  nextDate: string;
  lastDate?: string;
  url?: string;
  note?: string;
}

const Home: React.FC = () => {
  const [settingsModalIsOpen, setSettingsModalIsOpen] = useState(false);
  const [addModalIsOpen, setAddModalIsOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [deleteFocus, setDeleteFocus] = useState("");

  const [list, setList] = useState<listItem[]>([]);
  const [searchList, setSearchList] = useState<listItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [subs, setSubs] = useState<any[]>([]);

  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [newPeriod, setNewPeriod] = useState<ScheduleEvery>("month");
  const [newStartDate, setNewStartDate] = useState("");
  const [newNextDate, setNewNextDate] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newURL, setNewURL] = useState("");
  const [newNotify, setNewNotify] = useState(false);
  const [newNote, setNewNote] = useState("");

  const [today, setToday] = useState("");

  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");

  const [darkmodeSetting, setdarkmodeSetting] = useState("");
  const [version, setVersion] = useState("0.0.0");

  const languageList = [
    {
      lang: "en",
      langinlang: "English",
      langinenglish: "English",
      emoji: "🇺🇸",
    },
    {
      lang: "ja",
      langinlang: "日本語",
      langinenglish: "Japanese",
      emoji: "🇯🇵",
    },
    {
      lang: "fr",
      langinlang: "Français",
      langinenglish: "French",
      emoji: "🇫🇷",
    },
    {
      lang: "es",
      langinlang: "Español",
      langinenglish: "Spanish",
      emoji: "🇪🇸",
    },
  ];
  const { t, i18n } = useTranslation();
  const changeLanguage = async (lng: string) => {
    await Storage.set({ key: "language", value: lng });
    i18n.changeLanguage(lng);
  };

  const setStatusBarStyleDark = async () => {
    await StatusBar.setStyle({ style: Style.Dark });
  };
  const setStatusBarStyleLight = async () => {
    await StatusBar.setStyle({ style: Style.Light });
  };

  async function setDarkMode(dark: string) {
    setdarkmodeSetting(dark);
    if (dark === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
      document.body.classList.toggle("dark", prefersDark.matches);
      if (prefersDark.matches) {
        setStatusBarStyleDark();
      } else {
        setStatusBarStyleLight();
      }
    } else {
      document.body.classList.toggle("dark", dark === "dark" ? true : false);
      if (dark === "dark") {
        Keyboard.setStyle({ style: KeyboardStyle.Dark });
        setStatusBarStyleDark();
      } else {
        Keyboard.setStyle({ style: KeyboardStyle.Light });
        setStatusBarStyleLight();
      }
    }
    await Storage.set({
      key: "darkmode",
      value: dark,
    });
  }

  useIonViewWillEnter(() => {
    init();
  });

  useIonViewDidEnter(async () => {
    const { version } = await App.getInfo();
    setVersion(version);
  });

  async function init() {
    const { value } = await Storage.get({ key: "darkmode" });
    setdarkmodeSetting(value || "system");
    if (value === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
      document.body.classList.toggle("dark", prefersDark.matches);
      if (prefersDark.matches) {
        setStatusBarStyleDark();
      } else {
        setStatusBarStyleLight();
      }
    } else {
      document.body.classList.toggle("dark", value === "dark" ? true : false);
      if (value === "dark") {
        Keyboard.setStyle({ style: KeyboardStyle.Dark });
        setStatusBarStyleDark();
      } else {
        Keyboard.setStyle({ style: KeyboardStyle.Light });
        setStatusBarStyleLight();
      }
    }
    resetToday();
    resetNewContent();
    checkSubs();
    closeSliding();
    const db = await SubListDatabase.get();
    try {
      await db.sublist
        .find()
        .exec()
        .then((list: any) => {
          setList(
            list.sort((a: any, b: any) =>
              reformatDate(a.nextDate) >= reformatDate(b.nextDate) ? 1 : -1
            )
          );
        });
    } catch (e) {
      console.log(e);
    }
    setList(
      list.map((item: any) => {
        return {
          ...item,
          nextDate: calculateDates(item.startDate, item.period),
        };
      })
    );
    const sub = await db.sublist.find().$.subscribe((list: any) => {
      if (!list) {
        return;
      }
      setList(
        list.sort((a: any, b: any) =>
          reformatDate(a.nextDate) >= reformatDate(b.nextDate) ? 1 : -1
        )
      );
    });
    setSubs(subs.concat(sub));
    calculateDates(newStartDate, newPeriod);
  }

  function reformatDate(date: string) {
    const dateArray = date.split("-");
    return parseInt(`${dateArray[1]}${dateArray[2]}${dateArray[0]}`);
  }

  async function checkSubs() {
    const db = await SubListDatabase.get();
    try {
      await db.sublist
        .find()
        .where("nextDate")
        .eq(today)
        .exec()
        .then((list: any) => console.dir(list));
    } catch (e) {
      console.log(e);
    }
  }

  function resetToday() {
    var t = new Date();
    var dd = String(t.getDate()).padStart(2, "0");
    var mm = String(t.getMonth() + 1).padStart(2, "0");
    var yyyy = String(t.getFullYear());
    setNewStartDate(yyyy + "-" + mm + "-" + dd);
    setToday(yyyy + "-" + mm + "-" + dd);
  }

  function calculateDates(startDate: string, period: ScheduleEvery) {
    setNewStartDate(moment(startDate).format("YYYY-MM-DD"));
    setNewPeriod(period);
    var date = new Date(startDate);
    var t = moment();
    var d = moment(date);
    switch (period) {
      case "day":
        while (d.isSameOrBefore(t, "day")) {
          d.add(1, "d");
        }
        setNewNextDate(d.format("YYYY-MM-DD"));
        break;
      case "week":
        while (d.isSameOrBefore(t, "day")) {
          d.add(1, "w");
        }
        setNewNextDate(d.format("YYYY-MM-DD"));
        break;
      case "month":
        while (d.isSameOrBefore(t, "day")) {
          d.add(1, "M");
        }
        setNewNextDate(d.format("YYYY-MM-DD"));
        break;
      case "year":
        while (d.isSameOrBefore(t, "day")) {
          d.add(1, "y");
        }
        setNewNextDate(d.format("YYYY-MM-DD"));
        break;
      default:
        setNewNextDate(moment(date).format("YYYY-MM-DD"));
        break;
    }
  }

  function resetNewContent() {
    setNewName("");
    setNewIcon("");
    setNewPeriod("month");
    resetToday();
  }

  function random(length: number) {
    const num = Math.random();
    return {
      id: num.toString(16).substr(2, length),
      num: parseInt(num.toString(16).substr(2, length), 16),
    };
  }

  async function addNewItem() {
    const db = await SubListDatabase.get();
    const newId = random(16);
    const prop = {
      title: newName,
      body: "Subscription for " + newName + " is coming tomorrow.",
      id: newId.num,
      extra: {
        id: newId.id,
      },
      schedule: {
        at: new Date(newNextDate),
        every: newPeriod,
      },
    };
    LocalNotifications.checkPermissions().then((permissions) => {
      if (permissions.display === "granted") {
        LocalNotifications.schedule({
          notifications: [prop],
        });
      }
    });
    LocalNotifications.getPending().then((pending: any) => {
      console.log(pending);
    });
    try {
      await db.sublist.insert({
        subId: newId.id,
        name: newName,
        icon: newIcon || "",
        period: newPeriod,
        startDate: newStartDate,
        nextDate: newNextDate,
        price: newPrice || "",
        url: newURL || "",
        note: newNote || "",
        createdOn: moment().format("YYYY-MM-DD"),
      });
      init();
      setAddModalIsOpen(false);
    } catch (e) {
      console.log(e);
    }
  }

  async function searchItem(q: string) {
    setSearchQuery(q);
    if (q.length < 1) return setSearchList([]);
    init();
    const db = await SubListDatabase.get();
    try {
      var regexp = new RegExp("^.*" + q + ".*$", "i");
      await db.sublist
        .find()
        .where("name")
        .regex(regexp)
        .exec()
        .then((items: any) => {
          setSearchList(items);
        });
    } catch (e) {
      console.log(e);
    }
  }

  function showDeleteAlert(subId: string) {
    setDeleteAlert(true);
    setDeleteFocus(subId);
  }

  async function deleteItem(subId: string) {
    const db = await SubListDatabase.get();
    try {
      await db.sublist.find().where("subId").equals(subId).remove();
      init();
    } catch (e) {
      console.log(e);
    }
  }

  const ionListRef = useRef<HTMLIonListElement>(null);
  function closeSliding() {
    ionListRef.current?.closeSlidingItems();
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            <Trans>Subscriptions</Trans>
          </IonTitle>
          <IonButtons slot="primary">
            <IonButton onClick={() => setSettingsModalIsOpen(true)}>
              <IonIcon slot="icon-only" icon={settings} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonModal
        isOpen={settingsModalIsOpen}
        swipeToClose={true}
        onDidDismiss={() => setSettingsModalIsOpen(false)}
      >
        <IonPage>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setSettingsModalIsOpen(false)}>
                  <IonIcon slot="icon-only" icon={close} />
                </IonButton>
              </IonButtons>
              <IonTitle>
                <Trans>Settings</Trans>
              </IonTitle>
              <IonButtons slot="primary">
                <IonButton
                  onClick={async () =>
                    await setDarkMode(
                      darkmodeSetting === "dark" ? "light" : "dark"
                    )
                  }
                >
                  {darkmodeSetting === "dark" ? (
                    <IonIcon slot="icon-only" icon={moon} />
                  ) : (
                    <IonIcon slot="icon-only" icon={moonOutline} />
                  )}
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonList>
              <IonItem>
                <IonLabel>
                  <Trans>Date Format</Trans>
                </IonLabel>
                <IonSelect
                  value={dateFormat}
                  interface="popover"
                  onIonChange={(e) => setDateFormat(e.detail.value)}
                >
                  <IonSelectOption value="YYYY-MM-DD">
                    YYYY-MM-DD
                  </IonSelectOption>
                  <IonSelectOption value="MM/DD/YYYY">
                    MM/DD/YYYY
                  </IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <Trans>Version</Trans>
                </IonLabel>
                <IonText slot="end">{version}</IonText>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <Trans>Language</Trans>
                </IonLabel>
                <IonSelect
                  value={i18n.language}
                  placeholder="Language"
                  interface="popover"
                  onIonChange={(e) => changeLanguage(e.detail.value)}
                >
                  {languageList.map((lang) => (
                    <IonSelectOption value={lang.lang} key={lang.lang}>
                      {lang.emoji + lang.langinlang}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            </IonList>
            <div className="settings-icons-container">
              <IonButton
                fill={"clear"}
                onClick={async () =>
                  await Browser.open({
                    url: "https://github.com/bluelockorg/subscription-manager",
                  })
                }
              >
                <img
                  className="settings-icons"
                  alt="GitHub"
                  src={darkmodeSetting === "dark" ? githublight : githubdark}
                />
              </IonButton>
              <IonButton
                fill={"clear"}
                onClick={async () =>
                  await Browser.open({
                    url: "https://bluelock.org",
                  })
                }
              >
                <img
                  className="settings-icons"
                  alt="Bluelock Org"
                  src={bluelockorg}
                />
              </IonButton>
            </div>
          </IonContent>
        </IonPage>
      </IonModal>
      <IonModal
        isOpen={addModalIsOpen}
        swipeToClose={true}
        onDidDismiss={() => {
          resetNewContent();
          setAddModalIsOpen(false);
        }}
      >
        <IonPage>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton
                  onClick={() => {
                    setAddModalIsOpen(false);
                  }}
                >
                  <IonIcon slot="icon-only" icon={close} />
                </IonButton>
              </IonButtons>
              <IonButtons slot="primary">
                <IonButton onClick={() => addNewItem()}>
                  <Trans>Save</Trans>
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div className="icon-container"></div>
            <IonList>
              <IonItem>
                <IonLabel>
                  <strong>
                    <Trans>Name</Trans>
                  </strong>
                </IonLabel>
                <IonInput
                  value={newName}
                  placeholder={t("Name")}
                  className={"ion-text-right"}
                  onIonChange={(e) => setNewName(e.detail.value!)}
                ></IonInput>
              </IonItem>
              <IonItem>
                <IonDatetime
                  value={newStartDate}
                  presentation={"date"}
                  placeholder="Select Start Date"
                  onIonChange={(e) =>
                    calculateDates(e.detail.value!, newPeriod)
                  }
                >
                  <div slot="title">
                    <Trans>Start Date</Trans>
                  </div>
                </IonDatetime>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <strong>
                    <Trans>Period</Trans>
                  </strong>
                </IonLabel>
                <IonSelect
                  value={newPeriod}
                  multiple={false}
                  cancelText="Cancel"
                  okText="Select"
                  onIonChange={(e) =>
                    calculateDates(newStartDate, e.detail.value)
                  }
                >
                  <IonSelectOption value="day">
                    <Trans>Daily</Trans>
                  </IonSelectOption>
                  <IonSelectOption value="week">
                    <Trans>Weekly</Trans>
                  </IonSelectOption>
                  <IonSelectOption value="month">
                    <Trans>Monthly</Trans>
                  </IonSelectOption>
                  <IonSelectOption value="year">
                    <Trans>Yearly</Trans>
                  </IonSelectOption>
                  {/* <IonSelectOption value="custom">Custom</IonSelectOption> */}
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <strong>
                    <Trans>Next Date</Trans>
                  </strong>
                </IonLabel>
                <IonLabel className={"ion-text-right"}>
                  <h2>{newNextDate}</h2>
                  <p>{moment(newNextDate).fromNow()}</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <strong>
                    <Trans>Price</Trans>
                  </strong>
                </IonLabel>
                <IonInput
                  value={newPrice}
                  placeholder={t("Price & Currency")}
                  className={"ion-text-right"}
                  onIonChange={(e) => setNewPrice(e.detail.value!)}
                ></IonInput>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <strong>URL</strong>
                </IonLabel>
                <IonInput
                  value={newURL}
                  placeholder={t("URL")}
                  className={"ion-text-right"}
                  onIonChange={(e) => setNewURL(e.detail.value!)}
                ></IonInput>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <strong>
                    <Trans>Notify</Trans>
                  </strong>
                </IonLabel>
                <IonToggle
                  checked={newNotify}
                  onIonChange={(e) => setNewNotify(e.detail.checked)}
                />
              </IonItem>
              <IonItem>
                <IonLabel>
                  <strong>
                    <Trans>Note</Trans>
                  </strong>
                </IonLabel>
                <IonTextarea
                  value={newNote}
                  auto-grow
                  placeholder={t("Note")}
                  onIonChange={(e) => setNewNote(e.detail.value!)}
                ></IonTextarea>
              </IonItem>
            </IonList>
          </IonContent>
        </IonPage>
      </IonModal>
      <IonContent
        fullscreen
        scrollEvents
        onIonScrollStart={() => closeSliding()}
      >
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setAddModalIsOpen(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
        <IonSearchbar
          value={searchQuery}
          onIonChange={(e) => searchItem(e.detail.value!)}
        ></IonSearchbar>
        <IonList ref={ionListRef}>
          {searchQuery.length > 0
            ? searchList.length > 0
              ? searchList.map((item, index) => (
                  <IonItemSliding key={index}>
                    <IonItem routerLink={"/view/" + item.subId}>
                      <IonLabel>
                        <h2>{item.name}</h2>
                        <p>
                          <Trans>Next</Trans>: {item.nextDate}
                        </p>
                      </IonLabel>
                      <IonLabel className={"ion-text-right"}>
                        <p>{moment(item.nextDate).fromNow()}</p>
                      </IonLabel>
                    </IonItem>
                    <IonItemOptions side="end">
                      <IonItemOption
                        color="danger"
                        onClick={() => showDeleteAlert(item.subId)}
                      >
                        <IonIcon icon={trash} />
                      </IonItemOption>
                    </IonItemOptions>
                  </IonItemSliding>
                ))
              : null
            : list.map((item, index) => (
                <IonItemSliding key={index}>
                  <IonItem key={index} routerLink={"/view/" + item.subId}>
                    <IonLabel>
                      <h2>{item.name}</h2>
                      <p>
                        <Trans>Next</Trans>: {item.nextDate}
                      </p>
                    </IonLabel>
                    <IonLabel className={"ion-text-right"}>
                      <p>{moment(item.nextDate).fromNow()}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItemOptions side="end">
                    <IonItemOption
                      color="danger"
                      onClick={() => showDeleteAlert(item.subId)}
                    >
                      <IonIcon icon={trash} />
                    </IonItemOption>
                  </IonItemOptions>
                </IonItemSliding>
              ))}
        </IonList>
      </IonContent>
      <IonAlert
        isOpen={deleteAlert}
        onDidDismiss={() => setDeleteAlert(false)}
        header={"This cannot be undone."}
        buttons={[
          {
            text: t("Delete"),
            cssClass: "danger",
            handler: () => {
              deleteItem(deleteFocus);
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
