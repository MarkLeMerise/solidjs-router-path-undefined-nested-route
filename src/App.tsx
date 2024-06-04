import {
  Navigate,
  Route,
  Router,
  cache,
  createAsync,
  revalidate,
  useLocation,
} from "@solidjs/router";
import {
  ParentProps,
  Switch,
  Match,
  createMemo,
  createUniqueId,
} from "solid-js";

let loggedIn = true;
const logoutLandingPath = "unauthenticated";
const absolute_logoutLandingPath = `/${logoutLandingPath}`;

const getCurrentUserState = cache(
  () =>
    new Promise<boolean>((resolve) => setTimeout(() => resolve(loggedIn), 250)),
  "getCurrentUserState-" + createUniqueId()
);

export function App() {
  return (
    <Router root={Layout} rootLoad={() => getCurrentUserState()}>
      {/* Logging out from this route seems to be the root cause. */}
      <Route component={Home}>
        <Route path="/" />
      </Route>

      {/* Logging out from this route works fine */}
      <Route component={Home} path="/working-route" />
      <Route path={logoutLandingPath} component={LogoutLanding} />
    </Router>
  );
}

function LogoutLanding() {
  return (
    <div>
      not authenticated
      <button
        onClick={() => {
          loggedIn = true;
          void revalidate(getCurrentUserState.keyFor());
        }}
      >
        log in
      </button>
    </div>
  );
}

function Home() {
  return (
    <div>
      authenticated home page
      <button
        onClick={() => {
          loggedIn = false;
          void revalidate(getCurrentUserState.keyFor());
        }}
      >
        log out
      </button>
    </div>
  );
}

function Layout(props: ParentProps) {
  const location = useLocation();
  const userSession = createAsync(() => getCurrentUserState());
  const authState = createMemo(() => {
    const session = userSession();
    return session === undefined ? "LOADING" : session ? "AUTH" : "NOT_AUTH";
  });
  const redirect = createMemo(() => {
    if (authState() === "LOADING") return;

    const goingToLogoutLandingPage =
      location.pathname === absolute_logoutLandingPath;

    if (authState() === "AUTH") {
      return goingToLogoutLandingPage ? "/" : undefined;
    } else {
      return goingToLogoutLandingPage ? undefined : absolute_logoutLandingPath;
    }
  });

  return (
    <Switch fallback={<div>loading...</div>}>
      <Match when={redirect()}>{(href) => <Navigate href={href()} />}</Match>
      <Match when={authState() === "AUTH" || authState() === "NOT_AUTH"}>
        {props.children}
      </Match>
    </Switch>
  );
}
