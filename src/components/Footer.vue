<script setup>
import { ref, computed, onMounted } from 'vue'
import Panel from 'primevue/panel'
import Button from 'primevue/button'

const darkModeToken = 'my-app-dark';
const darkMode = ref(false);

function toggleDarkMode() {
  darkMode.value = document.documentElement.classList.toggle(darkModeToken);
}

const darkModeIconClass = computed(() => {
  return darkMode.value ? 'pi pi-moon' : 'pi pi-sun';
});

onMounted(() => {
  darkMode.value = document.body.classList.contains(darkModeToken);
});

</script>

<template>
    <Panel header="Information">
      <div id="bottomBar">
        <!--<a href="mailto://sabbiasoftware.gmail.com"><i class="pi pi-at"></i> sabbiasoftware@gmail.com</a>-->
        <span>Last update: Oct 10, 2025</span>
        <span class="filler">&nbsp;</span>
        <Button id="darkButton" :icon="darkModeIconClass" severity="primary" @click="toggleDarkMode" />
        <Button id="bmcButton" as="a" href="https://buymeacoffee.com/sabbiasoftware"><img src="../assets/bmc-logo.svg"/></Button>
        <!--<a href="https://buymeacoffee.com/sabbiasoftware"><img src="/public/bmc.png" class="bmc"/></a>-->
      </div>

    </Panel>
</template>

<style scoped>

#bottomBar {
  display: flex;
  justify-content: flex-end;
  align-items:center;
  gap: 1rem; 
}

.filler {
  flex-grow:1;
}

#bmcButton {
  height: 2.5rem;
  width: 2.5rem;
  img {
    height: 1.6rem;
    width: 1.6rem;
  }
}

.bmc {
  height: 2.5rem;
  margin-bottom: -0.4rem;
}

</style>

