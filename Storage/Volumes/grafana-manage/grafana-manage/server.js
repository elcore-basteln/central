const fs = require('fs').promises
const grafana = require('got').extend({
    prefixUrl: 'http://grafana:3000/api/',
    headers: {
        Authorization: 'Bearer eyJ...'
    },
    responseType: 'json'
});

const go = async () => {
    try {
        let zero = (await grafana('dashboards/uid/JRq3luOMz')).body.dashboard
        let one = (await grafana('dashboards/uid/1MoMACdMz')).body.dashboard

        await fs.writeFile('zero.json', JSON.stringify(zero))
        await fs.writeFile('one.json', JSON.stringify(one))

        if (zero.version === one.version) {
            setTimeout(go, 5 * 1000)
            return
        }

        let src, dst
        if (zero.version > one.version) {
            console.log(`zero.version ${zero.version} ---> one.version ${one.version}`)
            zero = JSON.stringify(zero)
            zero = zero.replace(/javascript\.0\.elcore_sysinfo/g, 'javascript.1.elcore_sysinfo')
            zero = JSON.parse(zero)
            src = zero
            dst = one
        } else {
            console.log(`zero.version ${zero.version} <--- one.version ${one.version}`)
            one = JSON.stringify(one)
            one = one.replace(/javascript\.1\.elcore_sysinfo/g, 'javascript.0.elcore_sysinfo')
            one = JSON.parse(one)
            src = one
            dst = zero
        }

        src.id = null
        src.uid = dst.uid
        src.title = dst.title.replace(/\(\d+\)/, `(${src.version})`)

        const src_ = JSON.stringify(src)
        for(var i = 0; i < 120; ++i) {
            const i_ = ('00' + i).slice(-3)
            const regexp = new RegExp(`javascript\.\\d\.elcore_sysinfo.${i_}`, 'g')
            if (!regexp.exec(src_))
                console.log(`Variable ${i_} unused`)
            else if (regexp.exec(src_))
                console.log(`Variable ${i_} used multiple times`)
        }

        await grafana.post('dashboards/db', { json: {
            dashboard: src,
            overwrite: true
        }})
    } catch (e) {
        console.log(e)
    }
    
    setTimeout(go, 5 * 1000)
}

setTimeout(go, 0)
