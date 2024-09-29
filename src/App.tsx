import { TabContext, TabList, TabPanel } from '@mui/lab'
import { Box, Button, Tab } from '@mui/material'
import { Close } from '@mui/icons-material'
import React from 'react';

type TabStatus = { name: 'inactive' } |
{
    name: 'active'
}

interface Tab {
    tabId: string
    status: TabStatus
    pendingAction: Promise<void>
}

interface TabList {
    activeTabId: string
    nextTabId: number
    tabs: Tab[],
}

export function App() {

    const [tabList, setTabList] = React.useState<TabList>({
        activeTabId: "",
        nextTabId: 1,
        tabs: []
    });

    const handleChange = (event: React.SyntheticEvent, activeTabId: string) => {
        setTabList(latest => ({ ...latest, activeTabId }));
    };
    
    const handleNewTab = React.useCallback(function newTab() {
        setTabList(latest => {
            const tabId = latest.nextTabId.toString()
            const activeTabId = tabId
            latest.nextTabId++
            return { ...latest, activeTabId, tabs: [ ...latest.tabs, {
                tabId,
                status: { name: 'inactive' },
                // Set tab status to 'active'
                pendingAction: tabActivate(tabId, setTabList)
            }]}
        })
    }, [])

    const handleCloseTab = React.useCallback(function handleCloseTab(event: React.MouseEvent, tabId: string) {

        // Stop the parent elements (the tab itself) receiving this click and firing an onChange event
        event.stopPropagation()

        setTabList(latest => {
            const idx = latest.tabs.findIndex(tab => tab.tabId == tabId)
            if (idx > -1) {
                const tab = latest.tabs[idx]
                tab.pendingAction.then(() => {
                    new Promise<void>(resolve => {
                        delay(500).then(() => {
                            resolve()
                            console.log(`tab ${tabId} now closed`)
                        })
                    })
                    setTabList(latest => {
                        // Remove close tab from tab list and update active tab id
                        let newActiveTabIdx = -1
                        const tabs = latest.tabs.filter((tab, idx) => {
                            if (tab.tabId !== tabId) {
                                return true
                            }
                            // Calculate index of new active tab
                            if (latest.tabs.length > 1) {
                                if (idx == latest.tabs.length - 1) {
                                    newActiveTabIdx = idx - 1
                                } else {
                                    newActiveTabIdx = idx
                                }
                            }
                            return false
                        })
                        const activeTabId = newActiveTabIdx > -1 ? tabs[newActiveTabIdx].tabId : ''
                        return { ...latest, activeTabId, tabs }
                    })
                })
            } else {
                console.log(`tab ${tabId} not found on close`)
            }
            return { ...latest }
        })
    }, [])

    // Change of active tab
    React.useEffect(() => {
        const activeTabId = tabList.activeTabId
        setTabList(latest => {
            const idx = latest.tabs.findIndex(tab => tab.tabId == activeTabId)
            if (idx > -1) {
                const tab = latest.tabs[idx]
                tab.pendingAction.then(() => {
                    if (tab.status.name == 'inactive') {
                        // Set tab status to active
                        setTabList(latest => {
                            const idx = latest.tabs.findIndex(tab => tab.tabId == activeTabId)
                            if (idx > -1) {
                                latest.tabs[idx].pendingAction = tabActivate(activeTabId, setTabList)
                            }
                            return { ...latest }
                        })
                    } else {
                        console.log(`Tab ${activeTabId} already active`)
                    }
                })
            }
            return { ...latest }
        })
        return () => {
            // Deactivate tab
            setTabList(latest => {
                const activeTabIdx = latest.tabs.findIndex(tab => tab.tabId == activeTabId)
                if (activeTabIdx > -1) {
                    const tab = latest.tabs[activeTabIdx]
                    tab.pendingAction.then(() => {
                        if (tab.status.name == 'active') {
                            // Set tab status to inactive
                            setTabList(latest => {
                                const idx = latest.tabs.findIndex(tab => tab.tabId == activeTabId)
                                if (idx > -1) {
                                    console.log('deactivate tab', latest.tabs[idx])
                                    latest.tabs[idx].pendingAction = tabDeactivate(activeTabId, setTabList)
                                }
                                return { ...latest }
                            })
                        } else {
                            console.log(`Tab ${activeTabId} already inactive`)
                        }
                    })
                }
                return { ...latest }
            })
        }
    }, [tabList.activeTabId, setTabList])

    return(
        <Box sx={{ width: '100%', typography: 'body1' }}>
            <Button onClick={handleNewTab}>New Tab</Button>
            <TabContext value={tabList.activeTabId}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList onChange={handleChange} aria-label="lab API tabs example">
                        {
                            Array.from(tabList.tabs).map(tab => (
                                <Tab
                                    key={tab.tabId}
                                    value={tab.tabId}
                                    label={`Item ${tab.tabId}`}
                                    icon={<Close id={`close-tab-${tab.tabId}`} onClick={(e) => handleCloseTab(e, tab.tabId)} />}
                                    iconPosition='end'
                                />
                            ))
                        }
                    </TabList>
                </Box>
                {
                    Array.from(tabList.tabs).map(tab => (
                        <TabPanel
                            key={tab.tabId}
                            value={tab.tabId}
                        >
                            {`id=${tab.tabId} status=${tab.status.name}`}
                        </TabPanel>
                    ))
                }
            </TabContext>
        </Box>
    )
}

function delay(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms))
}

function tabActivate(tabId: string, setTabList: React.Dispatch<React.SetStateAction<TabList>>) {
    return tabStatusUpdate(tabId, 'active', setTabList)
}

function tabDeactivate(tabId: string, setTabList: React.Dispatch<React.SetStateAction<TabList>>) {
    return tabStatusUpdate(tabId, 'inactive', setTabList)
}

function tabStatusUpdate(tabId: string, newStatus: 'inactive' | 'active', setTabList: React.Dispatch<React.SetStateAction<TabList>>) {
    return new Promise<void>(resolve => {
        delay(1000).then(() => {
            // Update status
            setTabList(tabList => {
                const idx = tabList.tabs.findIndex(tab => tab.tabId == tabId)
                if (idx > -1) {
                    tabList.tabs[idx].status = { name: newStatus }
                }
                resolve()
                return { ...tabList }
            })
        })
    })
}
