import { Fragment, useEffect, useState } from "react";
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions, Dialog, DialogBackdrop, Transition, TransitionChild } from "@headlessui/react";
import clsx from "~/utils/shared/ClassesUtils";
import { useNavigate } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { Command } from "~/application/dtos/layout/Command";

interface Props {
  isOpen: boolean;
  onClosed: () => void;
}

export default function AppCommandPalette({ onClosed, isOpen }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const commands: Command[] = [
    {
      command: "T",
      title: t("app.commands.tenants.title"),
      description: t("app.commands.tenants.description"),
    },
    {
      command: "P",
      title: t("app.commands.profile.title"),
      description: t("app.commands.profile.description"),
    },
    {
      command: "B",
      title: t("app.commands.blog.title"),
      description: t("app.commands.blog.description"),
      toPath: "/admin/blog/new",
    },
    {
      command: "Z",
      title: "Switch to App",
      description: "Go to /app",
      bgClassName: "bg-indigo-600",
      textClassName: "text-indigo-200",
      toPath: "/app",
    },
  ];

  const [query, setQuery] = useState("");

  const [items, setItems] = useState<Command[]>([]);
  const [filteredItems, setFilteredItems] = useState<Command[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<Command>();
  const [commandSearchTitle, setCommandSearchTitle] = useState<string>(t("app.commands.type"));

  useEffect(() => {
    setQuery("");
    if (!selectedCommand) {
      setCommandSearchTitle(t("app.commands.type"));
      setItems(commands);
    } else {
      if (selectedCommand.toPath) {
        navigate(selectedCommand.toPath);
        onClose();
      } else if (selectedCommand.onSelected) {
        selectedCommand.onSelected();
        onClose();
      } else {
        setCommandSearchTitle(`${selectedCommand.title}`);

        const items: Command[] = [];
        if (selectedCommand.command === "T") {
          items.push({
            title: `${t("app.commands.tenants.viewAll")}`,
            description: ``,
            command: "V",
            bgClassName: "bg-gray-600",
            textClassName: "text-white",
            toPath: "/app",
          });
          items.push({
            title: `${t("app.commands.tenants.create")}`,
            description: ``,
            command: "+",
            bgClassName: "bg-teal-600",
            textClassName: "text-teal-200",
            toPath: "/new-account",
          });
        }
        if (selectedCommand.command === "P") {
          items.push({
            title: `${t("app.commands.profile.update")}`,
            description: `${t("app.commands.profile.updateDescription")}`,
            command: "U",
            bgClassName: "bg-pink-600",
            textClassName: "text-pink-200",
            toPath: "/admin/profile",
          });
          items.push({
            title: `${t("app.commands.profile.logout")}`,
            description: `${t("app.commands.profile.logoutDescription")}`,
            command: "L",
            bgClassName: "bg-gray-600",
            textClassName: "text-white",
            toPath: "/logout",
          });
        }
        setItems(items);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCommand]);

  useEffect(() => {
    setItems(commands);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!query || query.trim() === "") {
      setFilteredItems(items);
    } else {
      setFilteredItems(
        items.filter(
          (item) =>
            item.toPath?.toLowerCase().trim().includes(query.toLowerCase().trim()) ||
            item.title.toLowerCase().trim().includes(query.toLowerCase().trim()) ||
            item.description.toLowerCase().trim().includes(query.toLowerCase().trim()) ||
            item.command.trim().toLowerCase() === query.toLowerCase().trim()
        )
      );
    }
  }, [items, query]);

  // useEffect(() => {
  //   if (!query || query.trim() === "") {
  //     setFilteredItems(items);
  //   } else {
  //     const itemsByCommand = items.filter((f) => f.command.trim().toLowerCase() === query.toLowerCase().trim());
  //     if (itemsByCommand.length === 1) {
  //       setQuery("");
  //       setSelectedCommand(itemsByCommand[0]);
  //       setFilteredItems(itemsByCommand);
  //     } else {
  //       setFilteredItems(
  //         itemsByCommand.filter(
  //           (item) =>
  //             item.title.toLowerCase().trim().includes(query.toLowerCase().trim()) ||
  //             item.description.toLowerCase().trim().includes(query.toLowerCase().trim()) ||
  //             item.command.trim().toLowerCase() === query.toLowerCase().trim()
  //         )
  //       );
  //     }
  //   }
  // }, [items, query]);

  function onChange(value: any) {
    setSelectedCommand(value as Command);
  }

  function onClose() {
    setSelectedCommand(undefined);
    setItems(commands);
    onClosed();
  }

  return (
    <>
      <Transition show={isOpen} as={Fragment} afterLeave={() => setQuery("")}>
        <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20" onClose={onClose}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <DialogBackdrop className="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" />
          </TransitionChild>

          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Combobox
              as="div"
              className="mx-auto max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all"
              onChange={onChange}
              value={query}
            >
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
                <ComboboxInput
                  className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-800 placeholder-gray-400 focus:ring-0 sm:text-sm"
                  placeholder={commandSearchTitle}
                  onChange={(event) => setQuery(event.target.value)}
                  autoComplete="off"
                />
              </div>
              {filteredItems.length > 0 && (
                <ComboboxOptions static className="max-h-96 scroll-py-3 overflow-y-auto p-3">
                  {filteredItems.map((item) => (
                    <ComboboxOption
                      key={item.command}
                      value={item}
                      className={({ active }) => clsx("flex cursor-pointer select-none rounded-xl p-3", active && "bg-gray-100")}
                    >
                      {({ active }) => (
                        <div className="flex w-full items-center justify-between pr-2">
                          {/* <div className={clsx("flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-accent-600", item.bgClassName)}>
                            <span className="inline-flex items-center justify-center h-9 w-9">
                              <span className={clsx("text-sm font-medium leading-none text-accent-200", item.textClassName)}>{item.command}</span>
                            </span>
                          </div> */}
                          <div className="flex-auto">
                            <p className={clsx("text-sm font-medium", active ? "text-gray-900" : "text-gray-700")}>{item.title}</p>
                            <p className={clsx("text-sm", active ? "text-gray-700" : "text-gray-500")}>{item.description}</p>
                          </div>
                        </div>
                      )}
                    </ComboboxOption>
                  ))}
                </ComboboxOptions>
              )}
              {query !== "" && filteredItems.length === 0 && (
                <div className="px-6 py-14 text-center text-sm sm:px-14">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mx-auto h-6 w-6 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="mt-4 font-semibold text-gray-900">{t("app.commands.empty.title")}</p>
                  <p className="mt-2 text-gray-500">{t("app.commands.empty.description")}</p>
                </div>
              )}
              {/* <div className="mt-4 flex py-4">
              <Link to="/new-account" className="text-sm font-medium text-theme-600 dark:text-theme-400 hover:text-theme-500 w-full text-center">
                Create an organization<span aria-hidden="true"> &rarr;</span>
              </Link>
            </div> */}
            </Combobox>
          </TransitionChild>
        </Dialog>
      </Transition>
    </>
  );
}
